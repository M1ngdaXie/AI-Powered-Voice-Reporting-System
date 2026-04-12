/**
 * End-to-end voice pipeline test
 * Usage: bun src/test-voice.ts <path-to-audio-file>
 * Example: bun src/test-voice.ts /tmp/test.webm
 */

const BASE = "http://localhost:3000";
const [, , audioPath] = process.argv;

if (!audioPath) {
  console.error("Usage: bun src/test-voice.ts <path-to-audio-file>");
  process.exit(1);
}

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exit(1); }
function step(msg: string) { console.log(`\n▶ ${msg}`); }

// ── 1. Login as a worker (register test account if needed) ───────────────────
const TEST_EMAIL = "test-worker@example.com";
const TEST_PASSWORD = "testworker1234";

step("Ensuring test worker account exists...");
const registerRes = await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: "Test Worker" }),
});
// 409 = already exists, both are fine
if (!registerRes.ok && registerRes.status !== 409) {
  fail(`Register failed: ${registerRes.status} ${await registerRes.text()}`);
}
pass(registerRes.status === 409 ? "Account already exists" : "Test worker registered");

step("Logging in as test worker...");
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
});

if (!loginRes.ok) fail(`Login failed: ${loginRes.status} ${await loginRes.text()}`);

const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
if (!cookie) fail("No auth cookie returned");
pass(`Authenticated as worker (${TEST_EMAIL})`);

// ── 2. Upload audio ───────────────────────────────────────────────────────────
step(`Uploading audio file: ${audioPath}`);
const audioFile = Bun.file(audioPath);
if (!(await audioFile.exists())) fail(`File not found: ${audioPath}`);

const form = new FormData();
form.append("audio", new File([await audioFile.arrayBuffer()], audioFile.name ?? "test.webm", { type: audioFile.type || "audio/webm" }));

const uploadStart = Date.now();
const uploadRes = await fetch(`${BASE}/api/transcribe`, {
  method: "POST",
  headers: { cookie: cookie! },
  body: form,
});

if (!uploadRes.ok) fail(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);

const { jobId, reportId } = await uploadRes.json() as { jobId: string; reportId: number };
pass(`Uploaded in ${Date.now() - uploadStart}ms → jobId=${jobId}, reportId=${reportId}`);

// ── 3. Poll until done ────────────────────────────────────────────────────────
step("Polling job status...");
const POLL_INTERVAL = 2500;
const MAX_POLLS = 60;
let lastStatus = "";

for (let i = 0; i < MAX_POLLS; i++) {
  await Bun.sleep(POLL_INTERVAL);

  const pollRes = await fetch(`${BASE}/api/jobs/${jobId}`, { headers: { cookie: cookie! } });
  if (!pollRes.ok) { console.log(`  poll ${i + 1}: HTTP ${pollRes.status}`); continue; }

  const data = await pollRes.json() as {
    status: "processing" | "done" | "failed";
    report?: Record<string, unknown>;
    error?: string;
  };

  if (data.status !== lastStatus) {
    console.log(`  poll ${i + 1}: ${data.status}`);
    lastStatus = data.status;
  }

  if (data.status === "done") {
    const elapsed = ((Date.now() - uploadStart) / 1000).toFixed(1);
    pass(`Completed in ${elapsed}s`);

    // ── 4. Print result ───────────────────────────────────────────────────────
    console.log("\n── Report ─────────────────────────────────────────────────────");
    const r = data.report as {
      summary?: string;
      tasksCompleted?: string[];
      tasksInProgress?: string[];
      blockers?: string[];
      transcript?: string;
    };

    console.log(`\nSummary:\n  ${r.summary ?? "(empty)"}`);
    console.log(`\nTasks Completed (${r.tasksCompleted?.length ?? 0}):`);
    r.tasksCompleted?.forEach((t) => console.log(`  • ${t}`));
    console.log(`\nIn Progress (${r.tasksInProgress?.length ?? 0}):`);
    r.tasksInProgress?.forEach((t) => console.log(`  • ${t}`));
    console.log(`\nBlockers (${r.blockers?.length ?? 0}):`);
    r.blockers?.forEach((t) => console.log(`  • ${t}`));
    console.log(`\nTranscript:\n  ${r.transcript ?? "(empty)"}`);
    console.log("\n───────────────────────────────────────────────────────────────");

    // ── 5. Validate output ────────────────────────────────────────────────────
    console.log("\n▶ Validating...");
    if (!r.transcript || r.transcript.trim().length < 5) fail("Transcript is empty — Whisper may have failed");
    pass("Transcript populated");
    if (!r.summary || r.summary.trim().length < 5) fail("Summary is empty — GPT-4o structuring may have failed");
    pass("Summary populated");
    const totalItems = (r.tasksCompleted?.length ?? 0) + (r.tasksInProgress?.length ?? 0) + (r.blockers?.length ?? 0);
    if (totalItems === 0) console.log("  ⚠ No structured items extracted (audio may have been too short or unclear)");
    else pass(`${totalItems} structured item(s) extracted`);

    // ── 6. Submit report (worker) ─────────────────────────────────────────────
    step("Submitting report to manager...");
    const submitRes = await fetch(`${BASE}/api/reports/${reportId}/submit`, {
      method: "PATCH",
      headers: { cookie: cookie! },
    });
    if (!submitRes.ok) fail(`Submit failed: ${submitRes.status} ${await submitRes.text()}`);
    const submitted = await submitRes.json() as { submitted?: boolean };
    if (!submitted.submitted) fail("Report submitted field is not true");
    pass(`Report ${reportId} submitted`);

    // ── 7. Submit feedback (worker) ───────────────────────────────────────────
    step("Submitting feedback...");
    const feedbackRes = await fetch(`${BASE}/api/feedback`, {
      method: "POST",
      headers: { cookie: cookie!, "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId,
        accurate: "Yes",
        easier: "Much easier",
        comment: "Automated test feedback",
      }),
    });
    if (!feedbackRes.ok) fail(`Feedback failed: ${feedbackRes.status} ${await feedbackRes.text()}`);
    const feedback = await feedbackRes.json() as { id?: number };
    if (!feedback.id) fail("Feedback response missing id");
    pass(`Feedback submitted (id=${feedback.id})`);

    // ── 8. Manager sees the submitted report ──────────────────────────────────
    step("Logging in as manager to verify report is visible...");
    const mgLogin = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL ?? "admin@example.com",
        password: process.env.ADMIN_PASSWORD ?? "admin1234",
      }),
    });
    if (!mgLogin.ok) fail(`Manager login failed: ${mgLogin.status}`);
    const mgCookie = mgLogin.headers.get("set-cookie")?.split(";")[0];
    if (!mgCookie) fail("No manager auth cookie");
    pass("Manager logged in");

    const reportsRes = await fetch(`${BASE}/api/reports`, { headers: { cookie: mgCookie } });
    if (!reportsRes.ok) fail(`GET /api/reports failed: ${reportsRes.status}`);
    const reports = await reportsRes.json() as { id: number }[];
    const found = reports.some((rep) => rep.id === reportId);
    if (!found) fail(`Report ${reportId} not found in manager's report list`);
    pass(`Report ${reportId} visible to manager (${reports.length} total submitted)`);

    console.log("\n✅ All tests passed\n");
    process.exit(0);
  }

  if (data.status === "failed") fail(`Job failed: ${data.error}`);
}

fail("Timed out after 2.5 minutes");
