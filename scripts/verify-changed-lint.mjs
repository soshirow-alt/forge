/**
 * Baseline-aware ESLint for dirty files vs an immutable BaseSha.
 * Does not modify the working tree (BaseSha file contents go to a temp tree).
 *
 * Usage:
 *   node scripts/verify-changed-lint.mjs --base-sha <40hex>
 *   node scripts/verify-changed-lint.mjs --selftest
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ESLINT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const EXCLUDE_PREFIXES = [".agent/", ".env"];

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  let baseSha = "";
  let outDir = path.join(ROOT, ".agent", "runtime");
  let selftest = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--selftest") {
      selftest = true;
    } else if (arg === "--base-sha") {
      baseSha = argv[++i] ?? "";
    } else if (arg === "--out-dir") {
      outDir = path.resolve(argv[++i] ?? "");
    }
  }
  if (selftest) return { selftest: true, baseSha: "", outDir };
  if (!/^[0-9a-f]{40}$/i.test(baseSha)) {
    die("USAGE: node scripts/verify-changed-lint.mjs --base-sha <40hex> | --selftest");
  }
  return { selftest: false, baseSha, outDir };
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    die(`git ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return (result.stdout || "").trim();
}

function isExcluded(rel) {
  const normalized = rel.replace(/\\/g, "/");
  if (EXCLUDE_PREFIXES.some((p) => normalized === p || normalized.startsWith(p))) {
    return true;
  }
  if (normalized.includes("/.env") || normalized.startsWith(".env")) {
    return true;
  }
  return false;
}

function isEslintTarget(rel) {
  if (isExcluded(rel)) return false;
  return ESLINT_EXT.has(path.extname(rel).toLowerCase());
}

function listDirtyEslintFiles() {
  const tracked = runGit(["diff", "--name-only", "HEAD"])
    .split(/\r?\n/)
    .filter(Boolean);
  const untracked = runGit(["ls-files", "--others", "--exclude-standard"])
    .split(/\r?\n/)
    .filter(Boolean);
  const all = [...new Set([...tracked, ...untracked])].sort();
  return all.filter(isEslintTarget);
}

/** @returns {object[]|null} */
function parseEslintJsonStdout(stdout) {
  const text = String(stdout || "");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function runEslintJson(files, cwd = ROOT) {
  if (files.length === 0) {
    return { exitCode: 0, results: [] };
  }
  const eslintBin = path.join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
  if (!fs.existsSync(eslintBin)) {
    die(`ESLint binary missing: ${eslintBin}`);
  }
  const result = spawnSync(
    process.execPath,
    [eslintBin, "--format", "json", "--max-warnings", "999999", ...files],
    {
      cwd,
      encoding: "utf8",
      maxBuffer: 40 * 1024 * 1024,
    },
  );
  const exitCode = result.status ?? 1;
  const results = parseEslintJsonStdout(result.stdout);
  if (results === null) {
    die(
      `ESLint did not return a JSON result array (exit=${exitCode}). ` +
        `Refusing to treat empty diagnostics as PASS.\n` +
        `${result.stderr || ""}\n${result.stdout || ""}`,
    );
  }
  return { exitCode, results };
}

function normalizePathKey(filePath, root) {
  return path
    .relative(root, filePath)
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
}

function missingResultFiles(results, files, root) {
  const reported = new Set(
    results.map((r) => normalizePathKey(r.filePath, root).replace(/\\/g, "/")),
  );
  return files.map((f) => f.replace(/\\/g, "/")).filter((f) => !reported.has(f));
}

function assertResultsCoverFiles(results, files, root, label) {
  const missing = missingResultFiles(results, files, root);
  if (missing.length > 0) {
    die(
      `${label}: ESLint results missing ${missing.length} target file(s):\n` +
        missing.map((f) => `  - ${f}`).join("\n"),
    );
  }
}

function flattenDiagnostics(eslintResults, root) {
  /** @type {{file:string,ruleId:string|null,severity:number,message:string}[]} */
  const out = [];
  for (const fileResult of eslintResults) {
    const file = normalizePathKey(fileResult.filePath, root);
    for (const msg of fileResult.messages || []) {
      out.push({
        file,
        ruleId: msg.ruleId ?? null,
        severity: msg.severity ?? 0,
        message: normalizeDiagnosticMessage(String(msg.message || ""), root),
      });
    }
  }
  return out;
}

function normalizeDiagnosticMessage(message, root) {
  let next = message.trim();
  const rootPosix = root.replace(/\\/g, "/");
  const rootWin = root.replace(/\//g, "\\");
  next = next.split(rootPosix).join("<ROOT>");
  next = next.split(rootWin).join("<ROOT>");
  next = next.replace(
    /[A-Za-z]:[\\/][^\n]*?(?=(components|lib|hooks|scripts|app)[\\/])/g,
    "<ROOT>/",
  );
  next = next.replace(/\\/g, "/");
  next = next.replace(/\n<ROOT>\/[^\n]*/g, "");
  next = next.replace(/\n\s*>?\s*\d+\s*\|[^\n]*/g, "");
  next = next.replace(/\n\s*\^+\s*[^\n]*/g, "");
  next = next.replace(/:\d+:\d+/g, "");
  return next.replace(/\s+/g, " ").trim();
}

function diagnosticKey(d) {
  return `${d.file}||${d.severity}||${d.ruleId || ""}||${d.message}`;
}

/** Multiset: extras in current beyond baseline counts are newly introduced. */
function newlyIntroducedDiagnostics(currentDiags, baselineDiags) {
  /** @type {Map<string, number>} */
  const remaining = new Map();
  for (const d of baselineDiags) {
    const k = diagnosticKey(d);
    remaining.set(k, (remaining.get(k) || 0) + 1);
  }
  const newly = [];
  for (const d of currentDiags) {
    const k = diagnosticKey(d);
    const left = remaining.get(k) || 0;
    if (left > 0) {
      remaining.set(k, left - 1);
    } else {
      newly.push(d);
    }
  }
  return newly;
}

function countBySeverity(diags) {
  let errors = 0;
  let warnings = 0;
  for (const d of diags) {
    if (d.severity >= 2) errors += 1;
    else if (d.severity === 1) warnings += 1;
  }
  return { errors, warnings };
}

function extractBaseTree(baseSha, files) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "forge-lint-base-"));
  const present = [];
  for (const rel of files) {
    const shown = spawnSync("git", ["show", `${baseSha}:${rel.replace(/\\/g, "/")}`], {
      cwd: ROOT,
      encoding: "buffer",
      maxBuffer: 20 * 1024 * 1024,
    });
    if (shown.status !== 0) {
      continue;
    }
    const dest = path.join(tempRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, shown.stdout);
    present.push(rel);
  }

  for (const configName of [
    "eslint.config.mjs",
    "eslint.config.js",
    "eslint.config.cjs",
    ".eslintrc.js",
    ".eslintrc.cjs",
    ".eslintrc.json",
    "package.json",
    "tsconfig.json",
    "tsconfig.eslint.json",
    "next.config.ts",
    "next.config.mjs",
    "next.config.js",
  ]) {
    const src = path.join(ROOT, configName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(tempRoot, configName));
    }
  }

  const nmSrc = path.join(ROOT, "node_modules");
  const nmDest = path.join(tempRoot, "node_modules");
  if (fs.existsSync(nmSrc) && !fs.existsSync(nmDest)) {
    try {
      fs.symlinkSync(nmSrc, nmDest, process.platform === "win32" ? "junction" : "dir");
    } catch (err) {
      die(
        `Failed to link node_modules into baseline temp tree: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  return { tempRoot, present };
}

function assertSelftest(name, condition) {
  if (!condition) {
    die(`SELFTEST FAIL: ${name}`);
  }
  console.log(`PASS  ${name}`);
}

function runSelftest() {
  const d = (file, severity, ruleId, message) => ({ file, severity, ruleId, message });
  const one = [d("a.ts", 2, "r", "m")];
  const two = [d("a.ts", 2, "r", "m"), d("a.ts", 2, "r", "m")];
  assertSelftest("multiset: 1→2 counts as new", newlyIntroducedDiagnostics(two, one).length === 1);
  assertSelftest("multiset: equal → none new", newlyIntroducedDiagnostics(one, one).length === 0);
  assertSelftest("multiset: 2→1 → none new", newlyIntroducedDiagnostics(one, two).length === 0);
  assertSelftest(
    "multiset: new file diag is new",
    newlyIntroducedDiagnostics([d("b.ts", 1, "x", "y")], []).length === 1,
  );

  assertSelftest("parse: empty stdout → null", parseEslintJsonStdout("") === null);
  assertSelftest("parse: no array → null", parseEslintJsonStdout("eslint failed hard") === null);
  assertSelftest(
    "parse: valid array",
    Array.isArray(parseEslintJsonStdout('[{"filePath":"a.ts","messages":[]}]')) &&
      parseEslintJsonStdout('[{"filePath":"a.ts","messages":[]}]').length === 1,
  );

  const coveredMissing = missingResultFiles(
    [{ filePath: path.join(ROOT, "a.ts"), messages: [] }],
    ["a.ts"],
    ROOT,
  );
  assertSelftest("cover: present file → no missing", coveredMissing.length === 0);
  assertSelftest(
    "cover: absent file → missing",
    missingResultFiles([], ["a.ts"], ROOT).join(",") === "a.ts",
  );

  assertSelftest(
    "policy: non-JSON must not be treated as empty PASS",
    parseEslintJsonStdout("Error: Cannot find module") === null,
  );

  console.log("changed-lint selftest: ALL PASS");
}

function main() {
  const { selftest, baseSha, outDir } = parseArgs(process.argv.slice(2));
  if (selftest) {
    runSelftest();
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  const head = runGit(["rev-parse", "HEAD"]);
  const files = listDirtyEslintFiles();
  fs.writeFileSync(
    path.join(outDir, "changed-lint-files.txt"),
    files.join("\n") + (files.length ? "\n" : ""),
    "utf8",
  );

  if (files.length === 0) {
    die("No ESLint-target dirty files found.", 0);
  }

  const current = runEslintJson(files, ROOT);
  assertResultsCoverFiles(current.results, files, ROOT, "current");
  const currentDiags = flattenDiagnostics(current.results, ROOT);
  fs.writeFileSync(
    path.join(outDir, "changed-lint-current.json"),
    JSON.stringify({ exitCode: current.exitCode, results: current.results }, null, 2),
    "utf8",
  );

  const { tempRoot, present } = extractBaseTree(baseSha, files);
  let baselineDiags = [];
  try {
    if (present.length > 0) {
      const baseline = runEslintJson(present, tempRoot);
      assertResultsCoverFiles(baseline.results, present, tempRoot, "baseline");
      baselineDiags = flattenDiagnostics(baseline.results, tempRoot).filter(
        (d) => d.ruleId !== null || !/outside of base path/i.test(d.message),
      );
      fs.writeFileSync(
        path.join(outDir, "baseline-lint.json"),
        JSON.stringify(
          {
            baseSha,
            exitCode: baseline.exitCode,
            files: present,
            diagnostics: baselineDiags,
          },
          null,
          2,
        ),
        "utf8",
      );
    } else {
      fs.writeFileSync(
        path.join(outDir, "baseline-lint.json"),
        JSON.stringify({ baseSha, exitCode: 0, files: [], diagnostics: [] }, null, 2),
        "utf8",
      );
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  const newlyIntroduced = newlyIntroducedDiagnostics(currentDiags, baselineDiags);

  const currentCounts = countBySeverity(currentDiags);
  const baselineCounts = countBySeverity(baselineDiags);
  const newCounts = countBySeverity(newlyIntroduced);

  const summary = {
    baseSha,
    head,
    targetFiles: files.length,
    targetFileList: files,
    baselineFilesCompared: present.length,
    current: currentCounts,
    baseline: baselineCounts,
    newlyIntroduced: newCounts,
    newlyIntroducedDiagnostics: newlyIntroduced,
    ok: newCounts.errors === 0 && newCounts.warnings === 0,
  };

  const summaryText = [
    `BaseSha: ${baseSha}`,
    `HEAD: ${head}`,
    `target files: ${files.length}`,
    `baseline files compared: ${present.length}`,
    `current errors: ${currentCounts.errors}`,
    `current warnings: ${currentCounts.warnings}`,
    `baseline errors: ${baselineCounts.errors}`,
    `baseline warnings: ${baselineCounts.warnings}`,
    `new errors: ${newCounts.errors}`,
    `new warnings: ${newCounts.warnings}`,
    `ok: ${summary.ok}`,
    "",
    "target files:",
    ...files.map((f) => `  - ${f}`),
    "",
    newlyIntroduced.length
      ? [
          "newly introduced diagnostics:",
          ...newlyIntroduced.map(
            (d) =>
              `  - [${d.severity >= 2 ? "error" : "warning"}] ${d.file} ${d.ruleId || "-"} ${d.message}`,
          ),
        ].join("\n")
      : "newly introduced diagnostics: (none)",
  ].join("\n");

  fs.writeFileSync(path.join(outDir, "lint-summary.txt"), summaryText + "\n", "utf8");
  fs.writeFileSync(
    path.join(outDir, "lint-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  console.log(summaryText);
  if (!summary.ok) {
    process.exit(1);
  }
}

main();
