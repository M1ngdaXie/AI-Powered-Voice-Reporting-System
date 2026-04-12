import { Hono } from "hono";
import { cors } from "hono/cors";
import { transcribeRoute } from "./routes/transcribe";
import { reportsRoute } from "./routes/reports";
import { feedbackRoute } from "./routes/feedback";
import { authRoute } from "./routes/auth";
import { adminRoute } from "./routes/admin";
import { jobsRoute } from "./routes/jobs";
import { authMiddleware, hashPassword } from "./auth";
import { getUserByEmail, insertUser } from "./db";
import { rateLimit } from "./rateLimit";

const app = new Hono();

app.use("*", cors({ origin: "http://localhost:5173", credentials: true }));

// Rate limit auth endpoints by IP — user is not authenticated yet
const byIp = (c: { req: { header: (k: string) => string | undefined } }) =>
  c.req.header("x-forwarded-for") ?? "local";
app.use("/api/auth/login",    rateLimit(10, 60, byIp));  // 10 attempts/min per IP
app.use("/api/auth/register", rateLimit(5,  60, byIp));  // 5 registrations/min per IP

// Public auth routes — mounted BEFORE the authMiddleware below.
// Hono resolves routes before middleware registered after them, so /api/auth/*
// routes are handled by authRoute without hitting the global authMiddleware.
// IMPORTANT: keep authRoute mounted before app.use("/api/*", authMiddleware).
app.route("/api", authRoute);

// All other /api/* routes require a valid JWT cookie.
app.use("/api/*", authMiddleware);

// Rate limits (applied after auth so we can key by userId)
app.use("/api/transcribe", rateLimit(20, 60));  // 20 uploads/min per user
app.use("/api/feedback",   rateLimit(10, 60));  // 10 feedback/min per user
app.use("/api/reports/*",  rateLimit(60, 60));  // 60 reads/min per user

app.route("/api", transcribeRoute);
app.route("/api", reportsRoute);
app.route("/api", feedbackRoute);
app.route("/api", adminRoute);
app.route("/api", jobsRoute);

app.get("/health", (c) => c.json({ status: "ok" }));

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";
  if (!email || !password) {
    console.log("No ADMIN_EMAIL/ADMIN_PASSWORD in .env — skipping admin seed");
    return;
  }
  const existing = await getUserByEmail(email);
  if (existing) { console.log("Admin account already exists"); return; }
  const hash = await hashPassword(password);
  await insertUser(email, name, hash, "manager");
  console.log(`Admin seeded: ${email}`);
}

seedAdmin();

export default { port: 3000, fetch: app.fetch };
console.log("Backend running on http://localhost:3000");
