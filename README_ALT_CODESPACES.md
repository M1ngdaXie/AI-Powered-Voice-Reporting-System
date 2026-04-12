# AI-Powered Voice Reporting System

> Turn employee voice updates into structured, professional reports automatically.

## Team Members
- Henny Guiesso
- Kayla Ramirez
- Yuting Wan
- Mingda Xie

---

## What It Does

Employees record a "stream-of-consciousness" voice update describing what they completed, what they're working on, and any blockers. The system automatically:

1. Uploads the audio to cloud storage (Cloudflare R2)
2. Transcribes it using OpenAI Whisper
3. Structures it into a professional report using GPT-4o
4. Stores the report in a cloud database (PostgreSQL)
5. Makes it available to managers in a real-time dashboard

The transcription happens asynchronously via a background job queue (BullMQ + Redis), so the UI responds instantly and never blocks on AI processing.

---

## Architecture

```
Frontend (React + Vite)
    │
    │  POST /api/transcribe  →  202 Accepted + jobId
    │  GET  /api/jobs/:jobId →  polls every 2.5s
    │
Backend (Bun + Hono)
    │
    ├── Cloudflare R2      (audio file storage)
    ├── Neon PostgreSQL     (users, reports, feedback)
    ├── Upstash Redis       (BullMQ job queue)
    │
    └── Worker Process
            ├── OpenAI Whisper   (speech → text)
            └── OpenAI GPT-4o    (text → structured report)
```

**Key design decision — async queue:** Without BullMQ, 10 simultaneous uploads would each hold an HTTP connection open for 10–30s waiting for AI. With BullMQ, all 10 get an instant `202 Accepted`, jobs queue in Redis, and the worker processes 3 at a time. The frontend polls for completion independently.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Bun.js, Hono, TypeScript |
| Database | PostgreSQL (Neon serverless) |
| Audio storage | Cloudflare R2 (S3-compatible) |
| Job queue | BullMQ + Upstash Redis |
| AI — transcription | OpenAI Whisper |
| AI — structuring | OpenAI GPT-4o |

---

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- Accounts for: [Neon](https://neon.tech), [Cloudflare R2](https://developers.cloudflare.com/r2/), [Upstash Redis](https://upstash.com), [OpenAI](https://platform.openai.com)

---

## Dependencies

- [Bun](https://bun.sh) — JavaScript runtime (replaces Node/npm)
- [Hono](https://hono.dev) — Backend web framework
- [OpenAI API](https://platform.openai.com) — Whisper (speech-to-text) + GPT-4o (report formatting)
- [React](https://react.dev) + [Vite](https://vitejs.dev) — Frontend
- [PostgreSQL via Neon](https://neon.tech) — Cloud database
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — Audio file storage
- [Redis via Upstash](https://upstash.com) — Job queue for async transcription processing
- [BullMQ](https://docs.bullmq.io) — Worker queue that processes transcription jobs

---

## Alternate Setup GitHub Codespaces 

### First time setup

1. Go to the GitHub repo
2. Click the green **Code** button
3. Click the **Codespaces** tab
4. Click **Create codespace on main**
5. Wait for it to load, then open the terminal
6. Install Bun:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
7. Reload the shell:
   ```bash
   source ~/.bashrc
   ```
8. Install backend dependencies:
   ```bash
   cd apps/backend && bun install
   ```
9. Click the **+** icon to open a second terminal, then install frontend dependencies:
   ```bash
   cd apps/frontend && bun install
   ```
10. Go back to terminal 1 and create the `.env` file:
    ```bash
    nano .env
    ```
11. Paste the following and fill in your values:
    ```
    OPENAI_API_KEY=your-openai-key-here
    JWT_SECRET=supersecret-change-in-production
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=admin1234
    ADMIN_NAME=Admin
    DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
    R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
    R2_ACCESS_KEY_ID=your-r2-access-key
    R2_SECRET_ACCESS_KEY=your-r2-secret-key
    R2_BUCKET=voice-reports-audio
    REDIS_URL=rediss://default:<password>@<host>:6379
    ```
    
Fill in `.env` with your credentials (see `.env.example` for all required fields):

| Variable | Where to get it |
|----------|----------------|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |
| `DATABASE_URL` | Neon project → Connection string |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → API tokens |
| `R2_BUCKET` | Name of your R2 bucket (e.g. `voice-reports-audio`) |
| `REDIS_URL` | Upstash Redis → REST URL (use the `rediss://` URL) |
| `JWT_SECRET` | Any random string |


12. Press **Ctrl+X → Y → Enter** to save

13. Now start the backend — in terminal 1:
    ```bash
    bun run dev:all
    ```
14. Click **+** to open terminal 2 and start the frontend:
    ```bash
    cd apps/frontend
    bun run dev
    ```
15. Open the browser link that appears in the frontend terminal

### Every time after that

1. Open your existing codespace
2. Terminal 1 (backend):
   ```bash
   cd apps/backend 
   bun run dev:all
   ```
3. Terminal 2 (frontend):
   ```bash
   cd apps/frontend
   bun run dev
   ```
4. Open the browser link that appears in the frontend terminal

```
---

## Default Accounts

The backend seeds a manager account on first start:

| Role | Email | Password |
|------|-------|----------|
| Manager | admin@example.com | admin1234 |

Register worker accounts via the `/register` page.

---

## User Flows

### Worker
1. Go to `/` → record via mic or upload an audio file
2. Click **Submit Recording** → instant response, report generates in background
3. View the structured report → edit if needed → click **Submit Report**
4. View all past reports at `/my-reports`

### Manager
1. Log in → redirected to `/manager` dashboard
2. Browse all submitted reports, click any to see full details + transcript
3. View AI feedback analytics at `/feedback`
4. Manage user roles at `/admin/users`

---

## Running the Tests

End-to-end pipeline test (requires an audio file):

```bash
cd apps/backend
bun test/test-voice.ts test/test.m4a
```

Covers: login → upload → transcription → GPT-4o structuring → submit report → feedback → manager view.

Peak concurrency test (verifies BullMQ queue behavior under load):

```bash
bun test/test-peak.ts test/test.m4a 6
```

Fires 6 simultaneous uploads. With `concurrency: 3` configured in the worker, the first 3 process immediately and the remaining 3 queue — confirming the system handles peak load without blocking or dropping jobs.

---

## Project Structure

```
apps/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Hono app entry point
│   │   ├── worker.ts         # BullMQ background worker (Whisper + GPT-4o)
│   │   ├── db.ts             # PostgreSQL queries (postgres.js)
│   │   ├── auth.ts           # JWT middleware + RBAC (worker/manager roles)
│   │   ├── r2.ts             # Cloudflare R2 upload/download
│   │   ├── queue.ts          # BullMQ queue + Redis connection
│   │   ├── schema.sql        # PostgreSQL schema
│   │   └── routes/
│   │       ├── transcribe.ts # POST /api/transcribe
│   │       ├── reports.ts    # GET/PUT/PATCH /api/reports
│   │       ├── jobs.ts       # GET /api/jobs/:jobId (polling endpoint)
│   │       ├── feedback.ts   # POST /api/feedback
│   │       ├── auth.ts       # POST /api/auth/login|register|logout
│   │       └── admin.ts      # PUT /api/admin/users/:id/role
│   ├── test/
│   │   ├── test-voice.ts     # Full pipeline E2E test
│   │   └── test-peak.ts      # Concurrency load test
│   └── .env.example          # Required environment variables
└── frontend/
    └── src/
        ├── pages/
        │   ├── RecordPage.tsx        # Worker: record + upload
        │   ├── ReportPage.tsx        # Worker: view + edit report
        │   ├── MyReportsPage.tsx     # Worker: report history
        │   ├── ManagerListPage.tsx   # Manager: all submitted reports
        │   ├── ManagerDetailPage.tsx # Manager: report detail view
        │   ├── FeedbackPage.tsx      # Manager: feedback analytics
        │   └── AdminUsersPage.tsx    # Manager: user role management
        └── context/
            ├── AuthContext.tsx       # JWT auth state
            └── ThemeContext.tsx      # Light/dark theme
```
