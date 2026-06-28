/**
 * production-mode 再発防止ガード（静的チェック）。
 *
 * Usage: npm run verify:production-mode-guards
 *
 * See docs/production-mode-audit.md
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const SCAN_DIRS = ["components", "hooks", "lib", "app"] as const;

const ALLOWED_IS_PREVIEW_FILES = new Set([
  "lib/production-mode.ts",
  "lib/preview-v0.ts",
]);

/** Whole-component swap when hideV0Mock — must stay in sync with audit doc. */
const HIGH_RISK_COMPONENT_SWAPS = new Set([
  "components/studio-mypage-page.tsx",
  "components/mypage-page.tsx",
  "components/community-hub-page.tsx",
  "components/game-detail-v0-page.tsx",
]);

/** Feature buttons must not be gated by isPreviewV0Deployment (grep heuristic). */
const FORBIDDEN_PREVIEW_FEATURE_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "isPreviewV0Deployment() used to hide UI",
    pattern: /isPreviewV0Deployment\s*\(\s*\)\s*\?\s*null/,
  },
  {
    label: "isPreviewV0Deployment() && !showDelete-style gate",
    pattern: /isPreviewV0Deployment\s*\(\s*\)\s*&&\s*!/,
  },
];

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      walkTsFiles(full, acc);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function main() {
  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    walkTsFiles(path.join(ROOT, dir), files);
  }

  let failed = 0;
  const warnings: string[] = [];

  for (const file of files) {
    const relPath = rel(file);
    const content = fs.readFileSync(file, "utf8");

    if (content.includes("isPreviewV0Deployment")) {
      if (!ALLOWED_IS_PREVIEW_FILES.has(relPath)) {
        failed += 1;
        console.log(`FAIL  ${relPath}: isPreviewV0Deployment() outside allowed files`);
      }
    }

    for (const { label, pattern } of FORBIDDEN_PREVIEW_FEATURE_PATTERNS) {
      if (pattern.test(content)) {
        failed += 1;
        console.log(`FAIL  ${relPath}: ${label}`);
      }
    }

    if (
      content.includes("shouldHideV0MockContent") &&
      /if\s*\(\s*!hideV0Mock\s*\)\s*\{\s*\n\s*return\s+</.test(content) &&
      HIGH_RISK_COMPONENT_SWAPS.has(relPath)
    ) {
      warnings.push(
        `${relPath}: hideV0Mock whole-component swap — see docs/production-mode-audit.md`,
      );
    }
  }

  if (warnings.length > 0) {
    console.log("\nWARN  High-risk hideV0Mock component swaps (documented):");
    for (const line of warnings) {
      console.log(`  - ${line}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} production-mode guard violation(s).`);
    process.exit(1);
  }

  console.log(`\nProduction-mode guards OK (${files.length} files scanned).`);
  if (warnings.length > 0) {
    console.log(`${warnings.length} documented high-risk swap(s) — review audit before release.`);
  }
}

main();
