/**
 * Peak concurrency test — fires N jobs simultaneously and shows queue behavior.
 * With concurrency:3 in the worker, jobs 1-3 start immediately, job 4+ waits.
 *
 * Usage: bun test/test-peak.ts <audio-file> [concurrency]
 * Example: bun test/test-peak.ts test/test.m4a 4
 */

const BASE = "http://localhost:3000";
const [, , audioPath, concurrencyArg] = process.argv;
const N = Number(concurrencyArg ?? 4);

if (!audioPath) {
  console.error("Usage: bun test/test-peak.ts <audio-file> [concurrency]");
  process.exit(1);
}

function pass(msg: string) { console.log(`  ✓ ${msg}`); }
function fail(msg: string) { console.error(`  ✗ ${msg}`); process.exit(1); }
function step(msg: string) { console.log(`\n▶ ${msg}`); }
function tag(i: number) { return `[job ${i + 1}/${N}]`; }

// ── Auth ──────────────────────────────────────────────────────────────────────
const TEST_EMAIL = "test-worker@example.com";
const TEST_PASSWORD = "testworker1234";

step("Ensuring test worker account exists...");
const reg = await fetch(`${BASE}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: "Test Worker" }),
});
if (!reg.ok && reg.status !== 409) fail(`Register failed: ${reg.status}`);
pass(reg.status === 409 ? "Account already exists" : "Test worker registered");

step("Logging in...");
const loginRes = await fetch(`${BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
});
if (!loginRes.ok) fail(`Login failed: ${loginRes.status}`);
const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
if (!cookie) fail("No auth cookie");
pass(`Authenticated as ${TEST_EMAIL}`);

// ── Read file once, reuse buffer ──────────────────────────────────────────────
const audioFile = Bun.file(audioPath);
if (!(await audioFile.exists())) fail(`File not found: ${audioPath}`);
const audioBuffer = await audioFile.arrayBuffer();
const audioName = audioFile.name ?? "test.webm";
const audioType = audioFile.type || "audio/webm";

// ── Fire N uploads concurrently ───────────────────────────────────────────────
step(`Firing ${N} uploads simultaneously (worker concurrency = 3)...`);
const globalStart = Date.now();

const jobs = await Promise.all(
  Array.from({ length: N }, async (_, i) => {
    const form = new FormData();
    form.append("audio", new File([audioBuffer], audioName, { type: audioType }));

    const t = Date.now();
    const res = await fetch(`${BASE}/api/transcribe`, {
      method: "POST",
      headers: { cookie: cookie! },
      body: form,
    });

    if (!res.ok) {
      console.error(`  ${tag(i)} upload failed: ${res.status}`);
      return null;
    }

    const { jobId, reportId } = await res.json() as { jobId: string; reportId: number };
    console.log(`  ${tag(i)} enqueued in ${Date.now() - t}ms → jobId=${jobId} reportId=${reportId}`);
    return { jobId, reportId, index: i };
  })
);

const validJobs = jobs.filter(Boolean) as { jobId: string; reportId: number; index: number }[];
const enqueueMs = Date.now() - globalStart;
console.log(`\n  All ${validJobs.length} jobs enqueued in ${enqueueMs}ms`);

if (enqueueMs > 5000) {
  console.log("  ⚠ Enqueue took >5s — check R2 upload speed");
} else {
  pass("All jobs enqueued fast (no waiting for AI)");
}

// ── Poll all jobs in parallel ─────────────────────────────────────────────────
step("Polling all jobs in parallel — watch for queue vs active...\n");

const results = await Promise.all(
  validJobs.map(async ({ jobId, reportId, index }) => {
    const jobStart = Date.now();
    let firstActive: number | null = null;
    let lastStatus = "";

    for (let p = 0; p < 80; p++) {
      await Bun.sleep(2500);

      const pollRes = await fetch(`${BASE}/api/jobs/${jobId}`, { headers: { cookie: cookie! } });
      if (!pollRes.ok) continue;

      const data = await pollRes.json() as { status: string; error?: string };

      if (data.status !== lastStatus) {
        const elapsed = ((Date.now() - globalStart) / 1000).toFixed(1);
        console.log(`  ${tag(index)} ${data.status.padEnd(10)} at ${elapsed}s`);
        if (data.status === "active" && firstActive === null) firstActive = Date.now();
        lastStatus = data.status;
      }

      if (data.status === "done") {
        const total = ((Date.now() - globalStart) / 1000).toFixed(1);
        const queued = firstActive ? ((firstActive - jobStart) / 1000).toFixed(1) : "0";
        return { index, reportId, success: true, totalSec: total, queuedSec: queued };
      }

      if (data.status === "failed") {
        console.error(`  ${tag(index)} FAILED: ${data.error}`);
        return { index, reportId, success: false, totalSec: "–", queuedSec: "–" };
      }
    }

    console.error(`  ${tag(index)} TIMED OUT`);
    return { index, reportId, success: false, totalSec: "timeout", queuedSec: "–" };
  })
);

// ── Summary ───────────────────────────────────────────────────────────────────
const totalElapsed = ((Date.now() - globalStart) / 1000).toFixed(1);
console.log("\n── Results ────────────────────────────────────────────────────");
console.log(`${"Job".padEnd(8)} ${"Report".padEnd(10)} ${"Queued".padEnd(12)} ${"Total".padEnd(10)} Status`);
console.log("─".repeat(55));

for (const r of results.sort((a, b) => a.index - b.index)) {
  const status = r.success ? "✓ done" : "✗ failed";
  const queued = r.queuedSec !== "0" && r.queuedSec !== "–" ? `${r.queuedSec}s waited` : "immediate";
  console.log(`${tag(r.index).padEnd(8)} ${String(r.reportId).padEnd(10)} ${queued.padEnd(12)} ${String(r.totalSec + "s").padEnd(10)} ${status}`);
}

console.log("─".repeat(55));
console.log(`Total wall time: ${totalElapsed}s for ${N} jobs`);

const passed = results.filter((r) => r.success).length;
const queued = results.filter((r) => r.queuedSec !== "0" && r.queuedSec !== "–").length;

console.log();
if (queued > 0) pass(`${queued} job(s) waited in queue (concurrency cap working)`);
if (passed === N) {
  console.log("\n✅ Peak concurrency test passed\n");
  process.exit(0);
} else {
  console.error(`\n✗ ${N - passed} job(s) failed\n`);
  process.exit(1);
}
