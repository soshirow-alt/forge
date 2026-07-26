#!/usr/bin/env node
/**
 * Static regression for 079 short-ASCII search rules (no DB write).
 * Mirrors forge_search_tokens / forge_is_short_ascii_query / match policy.
 *
 *   node scripts/staging-only/verify-079-short-ascii-search.mjs
 */

function forgeSearchNormalize(input) {
  return String(input ?? "")
    .toLowerCase()
    .replace(/[\s\p{P}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function forgeSearchTokens(input) {
  const re = /([a-zA-Z0-9]+|[^\s\p{P}a-zA-Z0-9]+)/gu;
  const out = [];
  let m;
  const s = String(input ?? "");
  while ((m = re.exec(s)) !== null) {
    const tok = m[1].toLowerCase();
    if (tok.length > 0) out.push(tok);
  }
  return out;
}

function isShortAsciiQuery(norm) {
  return /^[a-z0-9]{1,2}$/.test(norm ?? "");
}

function projectMatchesShort(p, term) {
  if (forgeSearchTokens(p.title).includes(term)) return true;
  for (const g of p.genres || []) {
    if (forgeSearchNormalize(g) === term || forgeSearchTokens(g).includes(term)) {
      return true;
    }
  }
  for (const t of p.tags || []) {
    if (String(t).startsWith("forge-")) continue;
    if (forgeSearchNormalize(t) === term || forgeSearchTokens(t).includes(term)) {
      return true;
    }
  }
  for (const k of p.assetKinds || []) {
    if (forgeSearchNormalize(k) === term || forgeSearchTokens(k).includes(term)) {
      return true;
    }
  }
  return false;
}

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

// Tokenization
assert(
  JSON.stringify(forgeSearchTokens("[IA Seed] SEキット基礎")) ===
    JSON.stringify(["ia", "seed", "se", "キット基礎"]),
  "SEキット token split",
);
assert(
  JSON.stringify(forgeSearchTokens("2Dイラスト")) ===
    JSON.stringify(["2d", "イラスト"]),
  "2Dイラスト token split",
);
assert(
  JSON.stringify(forgeSearchTokens("3Dキャラクター")) ===
    JSON.stringify(["3d", "キャラクター"]),
  "3Dキャラクター token split",
);
assert(
  JSON.stringify(forgeSearchTokens("UI素材")) === JSON.stringify(["ui", "素材"]),
  "UI素材 token split",
);
assert(
  JSON.stringify(forgeSearchTokens("2d_illustration")) ===
    JSON.stringify(["2d", "illustration"]),
  "asset_kind underscore split via punct",
);

// Short detector
assert(isShortAsciiQuery("se"), "SE is short ascii");
assert(isShortAsciiQuery("2d"), "2D is short ascii");
assert(isShortAsciiQuery("ai"), "AI is short ascii");
assert(!isShortAsciiQuery("bgm"), "BGM is not short");
assert(!isShortAsciiQuery("unity"), "Unity is not short");
assert(!isShortAsciiQuery("ドット"), "Japanese not short-ascii");

// Match policy samples
const seKit = {
  title: "[IA Seed] SEキット基礎",
  genres: ["SE"],
  tags: ["SE", "ゲーム向け音素材", "forge-ia-seed-v1"],
};
const noiseSeed = {
  title: "[IA Seed] アクション疾走デモ",
  genres: ["アクション"],
  tags: ["アクション", "forge-ia-seed-v1"],
};
const serviceApp = {
  title: "[IA Seed] 制作管理Webサービス",
  genres: ["Webサービス"],
  tags: ["Webサービス", "制作管理", "forge-ia-seed-v1"],
  category: "service-app",
};
const uiKit = {
  title: "[IA Seed] UI素材キット",
  genres: ["UI素材"],
  tags: ["UI素材", "アイコン"],
};
const tile2d = {
  title: "[IA Seed] ドット絵タイルセット",
  genres: ["2Dイラスト"],
  tags: ["ドット絵", "2Dイラスト"],
  assetKinds: ["2d_illustration", "sprite"],
};

assert(projectMatchesShort(seKit, "se"), "SE matches SEキット");
assert(!projectMatchesShort(noiseSeed, "se"), "SE does not match IA Seed title noise");
assert(!projectMatchesShort(serviceApp, "se"), "SE does not match service/Webサービス");
assert(projectMatchesShort(uiKit, "ui"), "UI matches UI素材キット");
assert(projectMatchesShort(tile2d, "2d"), "2D matches 2Dイラスト / asset_kind");

// Substring trap: seed contains se as letters but not as token
assert(!forgeSearchTokens("seed").includes("se"), "seed tokens exclude se");
assert(!forgeSearchTokens("service-app").includes("se"), "service-app tokens exclude se");
assert(!forgeSearchTokens("Staging seed developer").includes("se"), "profile seed excludes se");

if (process.exitCode) {
  console.error("\nverify-079-short-ascii-search: FAILED");
  process.exit(1);
}
console.log("\nverify-079-short-ascii-search: all passed");
