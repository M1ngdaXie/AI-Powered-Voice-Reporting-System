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
11. Paste the following and fill in your values (see other README.md for more details):
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
