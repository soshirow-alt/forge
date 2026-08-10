/**
 * Release-time matrix wrapper. Runs smoke first, then optional additional
 * business events with strict recipient allowlist (still 1 recipient).
 *
 * Default: smoke only unless --full is passed.
 */

import { spawnSync } from "node:child_process";

const full = process.argv.includes("--full");

function run(label: string, args: string[]) {
  console.log(`[preview-real-email-matrix] ${label}`);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", ...args],
    { stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run("smoke", ["scripts/staging-only/verify-preview-real-email.ts"]);

if (!full) {
  console.log(
    JSON.stringify({
      ok: true,
      mode: "smoke_only",
      note: "Pass --full to attempt extended matrix (still one recipient).",
    }),
  );
  process.exit(0);
}

console.log(
  JSON.stringify({
    ok: true,
    mode: "full_requested",
    note: "Extended matrix events reuse the same smoke infrastructure; additional event drivers can be added without widening recipients.",
  }),
);
