/**
 * Preflight for the Codex independent-review loop: is the CLI installed and authenticated?
 *
 * Usage: npm run verify:codex-available
 * Exit codes: 0 ready, 1 not usable (treat the review as BLOCKED).
 */
import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const command = isWindows ? "codex.cmd" : "codex";

function run(args) {
  // Node refuses to spawn .cmd shims without a shell; the args here are fixed literals.
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: isWindows,
    windowsHide: true,
  });
  if (result.error) {
    return { ok: false, text: result.error.message, code: null };
  }
  const text = `${result.stdout || ""}${result.stderr || ""}`.trim();
  return { ok: result.status === 0, text, code: result.status };
}

const version = run(["--version"]);
if (!version.ok) {
  process.stdout.write("CODEX=MISSING\n");
  process.stdout.write(`  ${version.text || "codex not found on PATH"}\n`);
  process.stdout.write("  install: npm install -g @openai/codex\n");
  process.exit(1);
}

const login = run(["login", "status"]);
const authenticated = login.ok && /logged in/i.test(login.text);

process.stdout.write(`CODEX=${authenticated ? "READY" : "UNAUTHENTICATED"} version=${version.text}\n`);
process.stdout.write(`  auth: ${login.text || "(no output)"}\n`);

if (!authenticated) {
  process.stdout.write("  owner action: run `codex login` in a terminal and complete sign-in\n");
  process.exit(1);
}

process.exit(0);
