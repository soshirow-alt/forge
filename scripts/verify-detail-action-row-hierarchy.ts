/**
 * Structural assert: Detail upper actions — left primary+FB | divider | retention.
 * md+: centered wrap cluster (safe when Detail aside narrows content).
 * Below md: stacked groups + horizontal separator.
 * Creator follow must not re-enter the upper action block.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("components/game-detail-v0-page.tsx");
const src = readFileSync(file, "utf8");

const marker =
  "md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-x-5 md:gap-y-3";
const start = src.indexOf(marker);
if (start < 0) {
  throw new Error("missing centered wrap action cluster wrapper");
}
const slice = src.slice(start, start + 6500);

const required = [
  marker,
  "min-h-10",
  "handleWatchToggle",
  "toggleSaved",
  "handleFeedback",
  "primaryPlayCtaLabel",
  "h-8 w-px shrink-0 bg-zinc-500/70",
  "h-px w-full shrink-0 bg-zinc-500/70 md:hidden",
  "flex min-w-0 flex-wrap items-center gap-1.5",
  "ログインして${primaryPlayCtaLabel}",
];
for (const token of required) {
  if (!slice.includes(token)) {
    throw new Error(`action row slice missing required token: ${token}`);
  }
}

if (/\bflex-nowrap\b/.test(slice)) {
  throw new Error("nowrap cluster risks overflow beside Detail aside; keep wrap");
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
if (feedbackBtn[1].includes("text-xs") || feedbackBtn[1].includes("py-2 ")) {
  throw new Error("feedback button must not use smaller py-2 / text-xs geometry");
}

if (/followCreatorLabel/.test(slice)) {
  throw new Error("creator follow re-entered upper action row");
}

const legacyTwoRow =
  /flex flex-col gap-2\.5[\s\S]{0,200}flex flex-wrap[\s\S]{0,800}<\/div>\s*<div className="flex flex-wrap items-center gap-2">/;
if (legacyTwoRow.test(src)) {
  throw new Error("legacy two-row action layout detected");
}

console.log(
  "verify-detail-action-row-hierarchy: PASS (wrap cluster + mobile separator)",
);
