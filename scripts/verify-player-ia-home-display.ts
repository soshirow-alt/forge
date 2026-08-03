import assert from "node:assert/strict";
import {
  displayPlayerIaHomeSeedText,
  formatPlayerIaVersionLabel,
  isPlayerIaSeedProjectId,
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

console.log("player-ia-home-display ok");
