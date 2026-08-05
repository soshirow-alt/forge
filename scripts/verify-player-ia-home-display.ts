import assert from "node:assert/strict";
import {
  displayPlayerIaHomeSeedText,
  formatPlayerIaRelativeTime,
  formatPlayerIaVersionLabel,
  isPlayerIaSeedProjectId,
  PLAYER_IA_DISPLAY_TIME_ZONE,
  stripPlayerIaSeedDisplayPrefix,
} from "../lib/player-ia/format";

assert.equal(stripPlayerIaSeedDisplayPrefix("[IA Seed] 新機能追加"), "新機能追加");
assert.equal(
  stripPlayerIaSeedDisplayPrefix(" [IA Seed] 不具合修正のみ "),
  "不具合修正のみ",
);
assert.equal(stripPlayerIaSeedDisplayPrefix("通常の更新"), "通常の更新");
assert.equal(
  stripPlayerIaSeedDisplayPrefix("説明内の [IA Seed] 表記"),
  "説明内の [IA Seed] 表記",
);
assert.equal(stripPlayerIaSeedDisplayPrefix(""), "");
assert.equal(stripPlayerIaSeedDisplayPrefix("  spaced  "), "  spaced  ");

const seedId = "eeeeeeee-eeee-4eee-8eee-000000000001";
const nonSeedId = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
assert.equal(isPlayerIaSeedProjectId(seedId), true);
assert.equal(isPlayerIaSeedProjectId(nonSeedId), false);
assert.equal(
  displayPlayerIaHomeSeedText(seedId, "[IA Seed] 新機能追加"),
  "新機能追加",
);
assert.equal(
  displayPlayerIaHomeSeedText(nonSeedId, "[IA Seed] 新機能追加"),
  "[IA Seed] 新機能追加",
);
assert.equal(
  displayPlayerIaHomeSeedText(nonSeedId, "  keep spaces  "),
  "  keep spaces  ",
);

assert.equal(formatPlayerIaVersionLabel(""), null);
assert.equal(formatPlayerIaVersionLabel("   "), null);
assert.equal(formatPlayerIaVersionLabel(null), null);
assert.equal(formatPlayerIaVersionLabel(undefined), null);
assert.equal(formatPlayerIaVersionLabel("0.2"), "ver 0.2");
assert.equal(formatPlayerIaVersionLabel("ver 1.0"), "ver 1.0");

const fixedNow = Date.parse("2026-08-06T03:00:00.000Z");
assert.equal(
  formatPlayerIaRelativeTime("2026-08-06T02:59:30.000Z", { nowMs: fixedNow }),
  "たった今",
);
assert.equal(
  formatPlayerIaRelativeTime("2026-08-06T02:45:00.000Z", { nowMs: fixedNow }),
  "15分前",
);
assert.equal(
  formatPlayerIaRelativeTime("2026-08-06T00:00:00.000Z", { nowMs: fixedNow }),
  "3時間前",
);
assert.equal(
  formatPlayerIaRelativeTime("2026-08-01T03:00:00.000Z", { nowMs: fixedNow }),
  "5日前",
);

const utcLabel = formatPlayerIaRelativeTime("2025-12-15T12:00:00.000Z", {
  nowMs: fixedNow,
  timeZone: "UTC",
});
assert.equal(
  formatPlayerIaRelativeTime("2025-12-15T12:00:00.000Z", {
    nowMs: fixedNow,
    timeZone: "UTC",
  }),
  utcLabel,
);

const tokyoLabel = formatPlayerIaRelativeTime("2025-12-15T12:00:00.000Z", {
  nowMs: fixedNow,
  timeZone: PLAYER_IA_DISPLAY_TIME_ZONE,
});
const laLabel = formatPlayerIaRelativeTime("2025-12-15T12:00:00.000Z", {
  nowMs: fixedNow,
  timeZone: "America/Los_Angeles",
});
// Same absolute instant + different TZ can yield different calendar days near boundaries;
// with noon UTC both Tokyo and LA are still Dec 15.
assert.equal(tokyoLabel, laLabel);
assert.match(tokyoLabel, /12月/);

console.log("player-ia-home-display ok");
