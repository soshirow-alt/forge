/**
 * Structural assert: Detail upper actions stay one row with left/right groups.
 * - Always flex-nowrap + overflow-x-auto (no wrap to a second action row)
 * - Divider always visible
 * - Creator follow must not re-enter the upper action block
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve("components/game-detail-v0-page.tsx");
const src = readFileSync(file, "utf8");

const marker = "flex-nowrap items-center gap-x-2.5 overflow-x-auto";
const start = src.indexOf(marker);
if (start < 0) {
  throw new Error("missing always-nowrap overflow-x-auto action row wrapper");
}
const slice = src.slice(start, start + 4500);

const required = [
  marker,
  "handleWatchToggle",
  "toggleSaved",
  "handleFeedback",
  "primaryPlayCtaLabel",
  "h-5 w-px shrink-0 bg-zinc-800",
];
for (const token of required) {
  if (!slice.includes(token)) {
    throw new Error(`action row slice missing required token: ${token}`);
  }
}

if (/flex-wrap/.test(slice)) {
  throw new Error("action row still uses flex-wrap (must stay one row)");
}
if (/hidden h-5 w-px/.test(slice) || /@min-\[\d+rem\]:block/.test(slice)) {
  throw new Error("divider must stay visible at all widths");
}
if (/@container/.test(slice) || /@min-\[\d+rem\]:flex-nowrap/.test(slice)) {
  throw new Error("container-query wrap threshold must not return");
}

const legacyTwoRow =
  /flex flex-col gap-2\.5[\s\S]{0,200}flex flex-wrap[\s\S]{0,800}<\/div>\s*<div className="flex flex-wrap items-center gap-2">/;
if (legacyTwoRow.test(src)) {
  throw new Error("legacy two-row action layout detected");
}

const actionBlockEnd = src.indexOf(
  "playUnavailableOnPublic || playUrlMissingVisible",
  start,
);
const actionBlock = src.slice(
  start,
  actionBlockEnd > start ? actionBlockEnd : start + 4000,
);
if (/followCreatorLabel/.test(actionBlock)) {
  throw new Error("creator follow re-entered upper action row");
}

console.log("verify-detail-action-row-hierarchy: PASS (always-nowrap + divider)");
