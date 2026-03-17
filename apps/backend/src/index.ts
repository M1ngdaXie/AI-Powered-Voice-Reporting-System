import { Hono } from "hono";
import { cors } from "hono/cors";
import { transcribeRoute } from "./routes/transcribe";
import { reportsRoute } from "./routes/reports";
import { feedbackRoute } from "./routes/feedback";

const app = new Hono();

app.use("*", cors({ origin: "http://localhost:5173" }));

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api", transcribeRoute);
app.route("/api", reportsRoute);
app.route("/api", feedbackRoute);

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Backend running on http://localhost:3000");
