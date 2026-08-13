/**
 * Structural assert: Detail upper actions — left-aligned primary+FB | divider | retention.
 * Divider uses symmetric md:mx-* between groups (not glued to retention).
 * Creator follow must not re-enter the upper action block.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("components/game-detail-v0-page.tsx");
const src = readFileSync(file, "utf8");

const marker = "md:flex-row md:flex-wrap md:items-center md:justify-start";
const start = src.indexOf(marker);
if (start < 0) {
  throw new Error("missing left-aligned action cluster wrapper");
}
const slice = src.slice(start, start + 6500);

const required = [
  marker,
  "min-h-10",
  "handleWatchToggle",
  "toggleSaved",
  "handleFeedback",
  "primaryPlayCtaLabel",
  "h-8 w-px shrink-0 bg-zinc-500/70 md:mx-4 md:block",
  "h-px w-full shrink-0 bg-zinc-500/70 md:hidden",
  "flex min-w-0 flex-wrap items-center gap-1.5",
  "ログインして${primaryPlayCtaLabel}",
];
for (const token of required) {
  if (!slice.includes(token)) {
    throw new Error(`action row slice missing required token: ${token}`);
  }
}

if (slice.includes("md:justify-center") || slice.includes("sm:justify-center")) {
  throw new Error("CTA row must stay left-aligned; justify-center was withdrawn");
}

if (/followCreatorLabel/.test(slice)) {
  throw new Error("creator follow re-entered upper action row");
}

const feedbackBtn = slice.match(
  /onClick=\{handleFeedback\}[\s\S]{0,280}className="([^"]+)"/,
);
if (!feedbackBtn) {
  throw new Error("feedback button className not found near handleFeedback");
}
if (!feedbackBtn[1].includes("min-h-10") || !feedbackBtn[1].includes("text-sm")) {
  throw new Error("feedback button must share min-h-10 + text-sm geometry");
}

console.log(
  "verify-detail-action-row-hierarchy: PASS (left align + symmetric divider gap)",
);
