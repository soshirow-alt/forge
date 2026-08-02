/**
 * Validate a Codex independent-review verdict file against the fixed Forge contract.
 *
 * Usage:
 *   node scripts/agents/validate-codex-review.mjs <review.json> [--normalized-out <file>] [--quiet]
 *
 * Exit codes:
 *   0  valid contract (verdict may still be FAIL_FIXABLE / NEEDS_OWNER_DECISION / BLOCKED)
 *   1  invalid / unparsable / self-contradicting  -> caller must treat as BLOCKED
 *   2  bad usage
 *
 * No external dependencies on purpose: this gate must keep working even when
 * node_modules is broken or the review ran on a machine without an install.
 */
import { readFileSync, writeFileSync } from "node:fs";

const VERDICTS = ["PASS", "FAIL_FIXABLE", "NEEDS_OWNER_DECISION", "BLOCKED"];
const SEVERITIES = ["critical", "high", "medium", "low"];
const TOP_KEYS = [
  "verdict",
  "summary",
  "findings",
  "tests_required",
  "owner_decisions",
];
const FINDING_KEYS = ["severity", "file", "line", "issue", "required_fix"];

const args = process.argv.slice(2);
const positional = [];
let normalizedOut = null;
let quiet = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--normalized-out") {
    normalizedOut = args[i + 1];
    i += 1;
  } else if (arg === "--quiet") {
    quiet = true;
  } else if (arg.startsWith("--")) {
    usage(`unknown option: ${arg}`);
  } else {
    positional.push(arg);
  }
}

if (positional.length !== 1) {
  usage("expected exactly one review file path");
}
if (normalizedOut === undefined || normalizedOut === "") {
  usage("--normalized-out requires a file path");
}

const reviewPath = positional[0];

function usage(message) {
  process.stderr.write(`validate-codex-review: ${message}\n`);
  process.stderr.write(
    "usage: node scripts/agents/validate-codex-review.mjs <review.json> [--normalized-out <file>] [--quiet]\n",
  );
  process.exit(2);
}

function fail(errors) {
  const list = Array.isArray(errors) ? errors : [errors];
  process.stdout.write("VALIDATION=FAIL VERDICT=BLOCKED\n");
  for (const error of list) {
    process.stdout.write(`  - ${error}\n`);
  }
  process.exit(1);
}

/**
 * Find top-level `{...}` regions while ignoring braces inside JSON strings.
 * Used only as a last resort so stray prose around the envelope stays detectable.
 */
function findObjectCandidates(text) {
  const candidates = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === "}") {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          candidates.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }
  return candidates;
}

function tryParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Contract: exactly one raw JSON object. No markdown fences, no surrounding prose.
 * (Matches codex-review-prompt.md + output schema.)
 */
function extractEnvelope(raw) {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false, error: "review file is empty" };

  if (/```/.test(trimmed)) {
    return {
      ok: false,
      error: "markdown fences are not allowed; return raw JSON only",
    };
  }

  const direct = tryParse(trimmed);
  if (direct.ok) return { ok: true, value: direct.value, source: "raw" };

  // Detect embedded objects only to give a clearer error — never accept them.
  const candidates = findObjectCandidates(trimmed);
  if (candidates.length >= 1) {
    return {
      ok: false,
      error:
        "JSON must be a single raw object with no surrounding prose (embedded/partial envelopes rejected)",
    };
  }
  return { ok: false, error: `not valid JSON (${direct.error})` };
}

function isPlainObject(value) {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

function validateStringArray(value, field, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array`);
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || entry.trim() === "") {
      errors.push(`${field}[${index}] must be a non-empty string`);
    }
  });
}

let raw;
try {
  raw = readFileSync(reviewPath, "utf8");
} catch (error) {
  fail(`cannot read ${reviewPath}: ${error.message}`);
}

// A UTF-8 BOM would break JSON.parse even for otherwise perfect output.
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

const extracted = extractEnvelope(raw);
if (!extracted.ok) fail(extracted.error);

const envelope = extracted.value;
const errors = [];

if (!isPlainObject(envelope)) {
  fail("review root must be a JSON object");
}

for (const key of Object.keys(envelope)) {
  if (!TOP_KEYS.includes(key)) errors.push(`unexpected top-level key: ${key}`);
}
for (const key of TOP_KEYS) {
  if (!(key in envelope)) errors.push(`missing required key: ${key}`);
}

if (typeof envelope.verdict !== "string") {
  errors.push("verdict must be a string");
} else if (!VERDICTS.includes(envelope.verdict)) {
  errors.push(
    `verdict must be one of ${VERDICTS.join(" | ")} (got ${JSON.stringify(envelope.verdict)})`,
  );
}

if (typeof envelope.summary !== "string" || envelope.summary.trim() === "") {
  errors.push("summary must be a non-empty string");
}

const counts = { critical: 0, high: 0, medium: 0, low: 0 };

if (!Array.isArray(envelope.findings)) {
  errors.push("findings must be an array");
} else {
  envelope.findings.forEach((finding, index) => {
    const at = `findings[${index}]`;
    if (!isPlainObject(finding)) {
      errors.push(`${at} must be an object`);
      return;
    }
    for (const key of Object.keys(finding)) {
      if (!FINDING_KEYS.includes(key)) {
        errors.push(`${at} has unexpected key: ${key}`);
      }
    }
    for (const key of FINDING_KEYS) {
      if (!(key in finding)) errors.push(`${at} missing key: ${key}`);
    }
    if (typeof finding.severity !== "string") {
      errors.push(`${at}.severity must be a string`);
    } else if (!SEVERITIES.includes(finding.severity)) {
      errors.push(
        `${at}.severity must be one of ${SEVERITIES.join(" | ")} (got ${JSON.stringify(finding.severity)})`,
      );
    } else {
      counts[finding.severity] += 1;
    }
    if (typeof finding.file !== "string" || finding.file.trim() === "") {
      errors.push(`${at}.file must be a non-empty string`);
    }
    if (finding.line !== null && typeof finding.line !== "string") {
      errors.push(`${at}.line must be a string or null`);
    }
    if (typeof finding.issue !== "string" || finding.issue.trim() === "") {
      errors.push(`${at}.issue must be a non-empty string`);
    }
    if (
      typeof finding.required_fix !== "string" ||
      finding.required_fix.trim() === ""
    ) {
      errors.push(`${at}.required_fix must be a non-empty string`);
    }
  });
}

validateStringArray(envelope.tests_required, "tests_required", errors);
validateStringArray(envelope.owner_decisions, "owner_decisions", errors);

// Contract consistency: a PASS must not carry unfinished work, and owner decisions belong to
// exactly one verdict. Without these checks a self-contradicting envelope could open the commit gate.
if (envelope.verdict === "PASS") {
  if (Array.isArray(envelope.findings) && envelope.findings.length > 0) {
    errors.push(
      `verdict PASS requires findings to be an empty array (got ${envelope.findings.length})`,
    );
  }
  if (counts.critical > 0 || counts.high > 0 || counts.medium > 0 || counts.low > 0) {
    errors.push(
      `verdict PASS contradicts findings (critical=${counts.critical}, high=${counts.high}, medium=${counts.medium}, low=${counts.low})`,
    );
  }
  if (Array.isArray(envelope.tests_required) && envelope.tests_required.length > 0) {
    errors.push(
      `verdict PASS requires tests_required to be empty (got ${envelope.tests_required.length})`,
    );
  }
}
if (
  envelope.verdict !== "NEEDS_OWNER_DECISION" &&
  Array.isArray(envelope.owner_decisions) &&
  envelope.owner_decisions.length > 0
) {
  errors.push(
    `owner_decisions is only allowed with verdict NEEDS_OWNER_DECISION (got ${envelope.verdict})`,
  );
}
if (
  envelope.verdict === "NEEDS_OWNER_DECISION" &&
  Array.isArray(envelope.owner_decisions) &&
  envelope.owner_decisions.length === 0
) {
  errors.push("verdict NEEDS_OWNER_DECISION requires at least one owner_decisions entry");
}

if (errors.length > 0) fail(errors);

if (normalizedOut) {
  try {
    writeFileSync(normalizedOut, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
  } catch (error) {
    fail(`cannot write ${normalizedOut}: ${error.message}`);
  }
}

if (!quiet) {
  process.stdout.write(
    `VALIDATION=OK VERDICT=${envelope.verdict} source=${extracted.source} ` +
      `findings=${envelope.findings.length} critical=${counts.critical} high=${counts.high} ` +
      `medium=${counts.medium} low=${counts.low} tests_required=${envelope.tests_required.length} ` +
      `owner_decisions=${envelope.owner_decisions.length}\n`,
  );
}

process.exit(0);
