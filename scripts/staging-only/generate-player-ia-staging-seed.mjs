#!/usr/bin/env node
/**
 * Generates Staging-only Player IA seed SQL + coverage JSON.
 * Does NOT touch any database.
 *
 *   node scripts/staging-only/generate-player-ia-staging-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;

const STAGING_REF = "vuqpwvjvgyxffmvpfrxo";
const PROD_REF = "bpnisgzxuwdxelhnduuf";
const OWNER_A = "dddddddd-dddd-4ddd-8ddd-000000000001"; // hero Dev B (fallback)
const OWNER_B = "dddddddd-dddd-4ddd-8ddd-000000000002"; // hero Dev C (fallback)
const PLAYERS = Array.from(
  { length: 10 },
  (_, i) => `dddddddd-dddd-4ddd-8ddd-0000000001${String(i + 1).padStart(2, "0")}`,
);
/** Dedicated auth-seed user UUID (player-ia-auth-seed.ts). Used when present. */
const dedicatedId = (slot) =>
  `a1a1a1a1-a1a1-41a1-81a1-${String(slot).padStart(12, "0")}`;
/**
 * Project n → dedicated profile slot (1–20).
 * Every slot owns ≥1 project when auth seed ran first.
 * Slot 16 (マルチA): game+audio+asset; slot 17 (マルチB): game+tool+service.
 */
const DEDICATED_SLOT_BY_N = {
  1: 16, 2: 17, 3: 1, 4: 2, 5: 18, 6: 7, 7: 20, 8: 1,
  9: 16, 10: 10, 11: 11, 12: 10, 13: 11, 14: 19, 15: 10, 16: 19,
  17: 16, 18: 8, 19: 9, 20: 8, 21: 9, 22: 4, 23: 11, 24: 19,
  25: 17, 26: 3, 27: 5, 28: 12, 29: 4, 30: 12, 31: 3, 32: 5,
  33: 17, 34: 13, 35: 15, 36: 14, 37: 13, 38: 15, 39: 14, 40: 6,
};
const TAG = "forge-ia-seed-v1";
const PREFIX = "[IA Seed]";
const SMOKE_A = "41ff5a96-105c-42a2-87b4-787bcfeacb45";
const HERO = "dddddddd-dddd-4ddd-8ddd-000000000203";
const ZERO_HIT = "zzz-ia-seed-nohit-999";

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (xs) => `ARRAY[${xs.map(q).join(", ")}]::text[]`;
const projId = (n) => `eeeeeeee-eeee-4eee-8eee-${String(n).padStart(12, "0")}`;
const usageId = (n) => `ffffffff-ffff-4fff-8fff-${String(n).padStart(12, "0")}`;
const annId = (n) => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
const guestFbId = (n) => `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;
const guestKey = (n) => `bbbbbbbb-bbbb-4bbb-8bbb-${String(100 + n).padStart(12, "0")}`;
const regFbId = (n) => `99999999-9999-4999-8999-${String(n).padStart(12, "0")}`;
const empId = (n) => `88888888-8888-4888-8888-${String(n).padStart(12, "0")}`;
const replyId = (n) => `77777777-7777-4777-8777-${String(n).padStart(12, "0")}`;
const logId = (n) => `66666666-6666-4666-8666-${String(n).padStart(12, "0")}`;
const relEvtId = (n) => `55555555-5555-4555-8555-${String(n).padStart(12, "0")}`;

const LONG_TITLE =
  "超長タイトルの検証用サンプル——検索一覧とカード折り返しと省略表示を確認するための非常に長い作品名でローグライク要素もタイトルに埋め込む";
const LONG_CREATOR =
  "IA Seed 超長い制作者表示名の折り返し検証用サンプルネームABCDEFG";
const LONG_DESC =
  `${PREFIX} 長い説明文エッジケースです。検索ヒット・カード展開・詳細ページでの折り返しを確認します。` +
  "短編のテンポと導線の話を中心に書きつつ、本文は通常の作品紹介として読める長さにしています。" +
  "あ".repeat(420);
const LONG_STREAM =
  "配信条件が長いエッジケース用メモ: クレジット必須・収益化は事前連絡・切り抜きはタイトルに作品名を含める・アーカイブは30日以内・Discord通知歓迎・その他個別相談。";

function buildProjects() {
  /** @type {any[]} */
  const specs = [];
  let n = 1;
  const push = (p) => {
    specs.push({
      n,
      id: projId(n),
      slug: `ia-seed-${String(n).padStart(2, "0")}`,
      version: `0.${(n % 5) + 1}`,
      ...p,
    });
    n += 1;
  };

  const games = [
    { title: "ローグライク迷宮探索", genres: ["ローグライク"], tags: ["ピクセルアート"], stream: "ok" },
    { title: "廃校ホラー短編", genres: ["ホラー"], tags: ["高難度"], stream: "conditional", streamNote: "クレジット必須" },
    { title: "アクション疾走デモ", genres: ["アクション", "RPG"], tags: ["協力プレイ"], stream: "no" },
    { title: "カード構築デュエル", genres: ["カードゲーム"], tags: ["PvP"], stream: "unset", noImage: true },
    { title: "パズル回廊", genres: ["パズル"], tags: ["癒し系", "ソロ向け"], stream: "ok", noUpdate: true },
    { title: "分岐ノベル短編", genres: ["ノベル"], tags: ["ストーリー重視"], stream: "conditional", noFb: true, noLinks: true },
    { title: "協力プレイ拠点防衛", genres: ["アクション"], tags: ["協力プレイ"], stream: "unset", discord: true },
    { title: LONG_TITLE, genres: ["ローグライク", "パズル"], tags: ["ピクセルアート", "短時間プレイ"], stream: "conditional", streamNote: LONG_STREAM, longTitle: true, longDesc: true, longCreator: true },
  ];
  games.forEach((g, i) =>
    push({
      category: "game",
      ...g,
      fallbackOwner: i % 2 === 0 ? OWNER_A : OWNER_B,
      quick_try: i % 3 !== 2,
      looking_for_testers: i % 4 === 0,
      usable_for_creation: false,
      purpose:
        i === 0
          ? ["テストプレイ", "配信OK"]
          : i === 1
            ? ["ホラー好き"]
            : i === 5 || i === 7
              ? ["短編ゲーム"]
              : ["テストプレイ"],
      multiLinks: i === 1 || i === 4,
    }),
  );

  const audios = [
    { title: "ループBGMパック", genres: ["BGM"], tags: ["BGM", "BGM制作", "ループ音源"], purpose: ["BGM制作", "制作に使える"] },
    { title: "オリジナル楽曲デモ", genres: ["楽曲"], tags: ["楽曲"], purpose: ["楽曲"] },
    { title: "SEキット基礎", genres: ["SE"], tags: ["SE", "ゲーム向け音素材"], purpose: ["ゲーム向け音素材"], discord: true },
    { title: "キャラボイス試作", genres: ["ボイス"], tags: ["ボイス"], purpose: ["ボイス"] },
    { title: "雨と風の環境音", genres: ["環境音"], tags: ["環境音"], purpose: ["環境音"] },
    { title: "朗読サンプル集", genres: ["朗読"], tags: [], purpose: ["朗読"], noTagsExtra: true },
    { title: "戦闘ループ音源", genres: ["ループ音源"], tags: ["ループ音源", "BGM", "BGM制作"], purpose: ["BGM制作"], noUpdate: true },
    { title: "ゲーム向け音素材一式", genres: ["ゲーム向け音素材"], tags: ["ゲーム向け音素材", "制作に使える"], purpose: ["制作に使える"] },
  ];
  audios.forEach((a, i) =>
    push({
      category: "audio",
      stream: ["ok", "conditional", "no", "unset"][i % 4],
      streamNote: i % 4 === 1 ? "クレジット必須" : null,
      fallbackOwner: i % 2 === 0 ? OWNER_B : OWNER_A,
      quick_try: i % 2 === 0,
      looking_for_testers: false,
      usable_for_creation: i !== 5,
      multiLinks: i === 0,
      ...a,
    }),
  );

  const assets = [
    { title: "ドット絵タイルセット", genres: ["2Dイラスト"], tags: ["ドット絵", "2Dイラスト", "スプライト"], kinds: ["2d_illustration", "sprite"], purpose: ["ドット絵"] },
    { title: "3Dキャラクター素体", genres: ["3Dモデル"], tags: ["3Dキャラクター", "キャラクターモデル"], kinds: ["character_model", "model_3d"], purpose: ["3Dキャラクター"] },
    { title: "背景レイヤーパック", genres: ["背景"], tags: ["背景"], kinds: ["background"], purpose: ["背景"], multiLinks: true },
    { title: "UI素材キット", genres: ["UI素材"], tags: ["UI素材", "アイコン"], kinds: ["ui_element", "icon"], purpose: ["UI制作"] },
    { title: "テクスチャ＆マテリアル", genres: ["テクスチャ"], tags: ["テクスチャ", "マテリアル"], kinds: ["texture", "material"], purpose: ["テクスチャ"], noImage: true },
    { title: "モーション＆アニメ", genres: ["モーション"], tags: ["モーション", "アニメーション"], kinds: ["motion", "animation"], purpose: ["モーション"] },
    { title: "VFX＆シェーダー", genres: ["VFX"], tags: ["VFX", "シェーダー"], kinds: ["vfx", "shader"], purpose: ["VFX"] },
    { title: "フォント＆アイコン拡張", genres: ["フォント"], tags: ["フォント", "アイコン", "制作に使える"], kinds: ["font", "icon"], purpose: ["制作に使える"], noFb: true, noLinks: true },
  ];
  assets.forEach((a, i) =>
    push({
      category: "asset",
      stream: "unset",
      fallbackOwner: i % 2 === 0 ? OWNER_A : OWNER_B,
      quick_try: false,
      looking_for_testers: i === 1,
      usable_for_creation: true,
      ...a,
    }),
  );

  const tools = [
    { title: "Unity向けデバッグ支援", genres: ["Unity"], tags: ["Unity", "デバッグ"], purpose: ["Unity"] },
    { title: "Unreal Engineビルド補助", genres: ["Unreal Engine"], tags: ["Unreal Engine", "ビルド支援"], purpose: ["Unreal Engine"] },
    { title: "Godotマップ生成", genres: ["Godot"], tags: ["Godot", "マップ生成"], purpose: ["Godot"] },
    { title: "会話システムSDK", genres: ["SDK"], tags: ["会話システム", "SDK"], purpose: ["会話システム"], discord: true },
    { title: "セーブシステムライブラリ", genres: ["コードライブラリ"], tags: ["セーブシステム", "コードライブラリ"], purpose: ["セーブシステム"] },
    { title: "CLIビルドランナー", genres: ["CLI"], tags: [], purpose: ["CLI"], noTagsExtra: true, noUpdate: true },
    { title: "Unity会話拡張", genres: ["Unity"], tags: ["Unity", "会話システム"], purpose: ["Unity"] },
    { title: "GodotセーブCLI", genres: ["Godot"], tags: ["Godot", "CLI", "セーブシステム"], purpose: ["Godot"] },
  ];
  tools.forEach((t, i) =>
    push({
      category: "dev-tool",
      stream: ["ok", "conditional", "no", "unset"][i % 4],
      fallbackOwner: i % 2 === 0 ? OWNER_B : OWNER_A,
      quick_try: i % 3 === 0,
      looking_for_testers: i % 2 === 0,
      usable_for_creation: true,
      multiLinks: i === 0,
      ...t,
    }),
  );

  const services = [
    { title: "制作管理Webサービス", genres: ["Webサービス"], tags: ["Webサービス", "制作管理"], purpose: ["制作管理"] },
    { title: "分析ダッシュボード", genres: ["分析"], tags: ["分析", "Webサービス"], purpose: ["分析"], multiLinks: true },
    { title: "配信支援Bot", genres: ["Bot"], tags: ["Bot", "配信支援", "配信者"], purpose: ["配信者"], discord: true },
    { title: "情報整理スマホアプリ", genres: ["スマホアプリ"], tags: ["スマホアプリ", "情報整理"], purpose: ["情報整理"] },
    { title: "PC向け制作ランチャー", genres: ["PCアプリ"], tags: ["PCアプリ"], purpose: ["PCアプリ"], noLinks: true },
    { title: "ブラウザ拡張メモ", genres: ["ブラウザ拡張"], tags: ["ブラウザ拡張"], purpose: ["ブラウザ拡張"] },
    { title: "AIサービス試作", genres: ["AIサービス"], tags: ["AIサービス", "制作に使える"], purpose: ["制作に使える"], longDesc: true },
    { title: "配信者向け支援ハブ", genres: ["配信支援"], tags: ["配信者", "配信支援", "配信OK"], purpose: ["配信OK", "配信者"], discord: true, stream: "ok" },
  ];
  services.forEach((s, i) =>
    push({
      category: "service-app",
      stream: s.stream || ["ok", "conditional", "no", "unset"][i % 4],
      streamNote: (s.stream || ["ok", "conditional", "no", "unset"][i % 4]) === "conditional" ? "条件あり" : null,
      fallbackOwner: i % 2 === 0 ? OWNER_A : OWNER_B,
      quick_try: i % 2 === 1,
      looking_for_testers: i === 2 || i === 6,
      usable_for_creation: i === 0 || i === 6,
      ...s,
    }),
  );

  if (specs.length !== 40) throw new Error(`expected 40 projects, got ${specs.length}`);

  // Bind dedicated auth slots (optional at apply time) + hero fallbacks.
  for (const p of specs) {
    const slot = DEDICATED_SLOT_BY_N[p.n];
    if (!slot) throw new Error(`missing dedicated slot for project n=${p.n}`);
    p.dedicatedSlot = slot;
    p.preferredOwnerId = dedicatedId(slot);
    if (!p.fallbackOwner) p.fallbackOwner = p.n % 2 === 0 ? OWNER_B : OWNER_A;
  }

  const slotsUsed = new Set(specs.map((p) => p.dedicatedSlot));
  for (let s = 1; s <= 20; s++) {
    if (!slotsUsed.has(s)) {
      throw new Error(`dedicated slot ${s} owns zero projects — would create orphan profile`);
    }
  }
  const multiA = specs.filter((p) => p.dedicatedSlot === 16).map((p) => p.category);
  const multiB = specs.filter((p) => p.dedicatedSlot === 17).map((p) => p.category);
  if (new Set(multiA).size < 3 || new Set(multiB).size < 3) {
    throw new Error(`multi-category owners incomplete: 16=${multiA} 17=${multiB}`);
  }

  return specs;
}

/** SQL expr: dedicated auth user if present, else hero fallback. */
function ownerSql(p) {
  return `COALESCE(
    (SELECT id FROM auth.users WHERE id = '${p.preferredOwnerId}'::uuid),
    '${p.fallbackOwner}'::uuid
  )`;
}

/** SQL expr: profile public_name when dedicated exists, else fallback label. */
function creatorSql(p) {
  if (p.longCreator) return q(LONG_CREATOR);
  const fallback =
    p.fallbackOwner === OWNER_A ? "IA Seed Owner A" : "IA Seed Owner B";
  return `COALESCE(
    (SELECT public_name FROM public.developer_profiles WHERE user_id = '${p.preferredOwnerId}'::uuid),
    ${q(fallback)}
  )`;
}

/** Prefer live project.owner_id after INSERT (works with auth or fallback). */
function projectOwnerRef(projectId) {
  return `(SELECT owner_id FROM public.projects WHERE id = '${projectId}'::uuid)`;
}

function buildUsage(projects) {
  const by = (c) => projects.filter((p) => p.category === c);
  const pairs = [
    [by("game")[0], by("audio")[0]],
    [by("game")[1], by("audio")[2]],
    [by("game")[2], by("asset")[0]],
    [by("game")[3], by("asset")[1]],
    [by("game")[4], by("dev-tool")[0]],
    [by("game")[5], by("dev-tool")[2]],
    [by("dev-tool")[3], by("dev-tool")[5]],
    [by("dev-tool")[6], by("dev-tool")[1]],
    [by("service-app")[0], by("dev-tool")[4]],
    [by("service-app")[2], by("dev-tool")[0]],
    [by("game")[6], by("asset")[3]],
    [by("service-app")[6], by("dev-tool")[3]],
  ];
  return pairs.map(([source, target], i) => ({
    id: usageId(i + 1),
    source,
    target,
  }));
}

function buildRegisteredFeedback(projects) {
  const items = [];
  let n = 1;
  const add = (row) => {
    items.push({ n, id: regFbId(n), ...row });
    n += 1;
  };
  const targets = projects.filter((p) => !p.noFb);
  const multi = targets[0];
  // 4 FB on same project from different players
  for (let i = 0; i < 4; i++) {
    add({
      project: multi,
      user: PLAYERS[i],
      good:
        i === 2
          ? "代表レビュー向け長文です。初回プレイでテンポと改善点がすぐ分かり、次のバージョンで直したい点が明確になりました。ローグライク寄りの進行でも短編ゲームとして完走でき、制作に使える示唆がありました。"
          : `短文FB #${i + 1}: テンポが良いです。`,
      concerns: i === 1 ? "もう少しヒントが欲しい。" : null,
      empathy: i === 0 ? 0 : i === 1 ? 2 : i === 2 ? 10 : 8,
      reply: i === 1 || i === 2,
    });
  }
  let pi = 0;
  for (const p of targets.slice(1, 28)) {
    const empathy = [0, 0, 1, 3, 5, 0, 2][pi % 7];
    add({
      project: p,
      user: PLAYERS[pi % PLAYERS.length],
      good: `登録ユーザーFB（${p.category}）: 雰囲気が良い。`,
      concerns: pi % 5 === 0 ? "細かい調整希望。" : null,
      empathy,
      reply: pi % 3 === 0,
    });
    pi += 1;
  }
  return items;
}

function buildGuestFeedback(projects) {
  const items = [];
  let n = 1;
  const add = (row) => {
    items.push({ n, id: guestFbId(n), submitter: guestKey(n), ...row });
    n += 1;
  };
  const withFb = projects.filter((p) => !p.noFb);
  add({ project: withFb[0], good: "ゲスト短文: 雰囲気が好き。", empathy: 0, reply: false });
  add({ project: withFb[0], good: null, concerns: "ゲスト: もう少しヒントが欲しい。", empathy: 1, reply: true, versionBump: true });
  // Note: guest unique is (submitter_key, project_id, version_key) — same project needs different submitter or version
  // Fix: use different submitters (already unique per n). Same version_key OK with different submitter_key.
  add({
    project: withFb.find((p) => p.category === "audio"),
    good: "ゲスト: BGM制作の参考になりました。",
    empathy: 0,
    reply: false,
  });
  add({
    project: withFb.find((p) => p.category === "asset"),
    good: "ゲスト: ドット絵が使いやすいです。",
    empathy: 4,
    reply: false,
  });
  add({
    project: withFb.find((p) => p.category === "dev-tool"),
    good: "ゲスト: Unity連携が分かりやすい。",
    empathy: 2,
    reply: true,
  });
  add({
    project: withFb.find((p) => p.category === "service-app"),
    good: "ゲスト短文: 配信者向けで助かる。",
    empathy: 0,
    reply: false,
  });
  add({
    project: withFb.find((p) => p.category === "game" && p.n !== withFb[0].n),
    good: "ゲスト: ホラー好きには刺さりそう。",
    empathy: 3,
    reply: false,
  });
  return items;
}

function buildDevlogs(projects) {
  const kinds = [
    { title: "初回公開", content: "初回公開しました。", initial: true, version: null },
    { title: "軽微編集（誤字修正）", content: "説明文の誤字を直しました。", initial: false, version: null },
    { title: "意味のある更新（体験改善）", content: "導線とテンポを改善しました。", initial: false, version: null },
    { title: "バージョン更新", content: "ver表示とビルドを更新しました。", initial: false, bump: true },
    { title: "新機能追加", content: "新機能を追加しました。", initial: false, bump: true },
    { title: "新コンテンツ追加", content: "新コンテンツを追加しました。", initial: false, bump: true },
    { title: "対応環境追加", content: "対応環境を追加しました。", initial: false, version: null },
    { title: "不具合修正のみ", content: "不具合のみ修正しました。", initial: false, version: null },
  ];
  const logs = [];
  let n = 1;
  const withUpdates = projects.filter((p) => !p.noUpdate);
  withUpdates.forEach((p, i) => {
    const k = kinds[i % kinds.length];
    const ver = k.bump ? `${p.version}.${(i % 3) + 1}` : k.version;
    logs.push({
      n,
      id: logId(n),
      project: p,
      kind: k.title,
      title: `${PREFIX} ${k.title}`,
      content: `${PREFIX} ${k.content}`,
      initial: k.initial,
      published_version: ver,
      daysAgo: (i % 18) + 1,
    });
    n += 1;
  });
  // Extra non-initial updates for shelf density
  for (let i = 0; i < 8; i++) {
    const p = withUpdates[i];
    const k = kinds[(i + 3) % kinds.length];
    logs.push({
      n,
      id: logId(n),
      project: p,
      kind: k.title,
      title: `${PREFIX} ${k.title} (extra)`,
      content: `${PREFIX} ${k.content}`,
      initial: false,
      published_version: k.bump ? `${p.version}.9` : null,
      daysAgo: i + 1,
    });
    n += 1;
  }
  return logs;
}

function buildReleaseEvents(projects) {
  // A few "released" events for version_update / meaningful shelf
  return projects
    .filter((p) => !p.noUpdate)
    .slice(0, 8)
    .map((p, i) => ({
      id: relEvtId(i + 1),
      project: p,
      daysAgo: i + 3,
    }));
}

function buildAnnouncements() {
  const rows = [
    { slug: "ia-seed-welcome", title: "Player IA: 検索タブの使い方", daysAgo: 1, draft: false, importance: "important" },
    { slug: "ia-seed-category-tips", title: "カテゴリ横断の見つけ方", daysAgo: 3, draft: false, importance: "normal" },
    { slug: "ia-seed-usage-tips", title: "使用関係の見方", daysAgo: 5, draft: false, importance: "normal" },
    { slug: "ia-seed-creation", title: "制作に使える作品の探し方", daysAgo: 8, draft: false, importance: "normal" },
    { slug: "ia-seed-stream-ok", title: "配信OK作品の見つけ方", daysAgo: 12, draft: false, importance: "normal" },
    { slug: "ia-seed-feedback", title: "フィードバックの届け方", daysAgo: 18, draft: false, importance: "normal" },
    { slug: "ia-seed-draft-hidden", title: "下書き: 次の案内（非公開）", daysAgo: 0, draft: true, importance: "normal" },
    { slug: "ia-seed-draft-memo", title: "下書き: 内部メモ", daysAgo: 2, draft: true, importance: "normal" },
  ];
  return rows.map((r, i) => ({
    id: annId(i + 1),
    ...r,
    body: `${PREFIX} ${r.title} — Staging専用お知らせ（${TAG}）。検索0件確認語 ${ZERO_HIT} は作品側に置かない。`,
  }));
}

function relatedLinksSql(p) {
  if (p.noLinks) return "NULL";
  if (p.multiLinks) {
    return `${q(
      JSON.stringify([
        { id: `${p.slug}-rel-1`, kind: "official_site", url: `https://example.com/ia-seed/${p.slug}`, label: "公式" },
        { id: `${p.slug}-rel-2`, kind: "note_blog", url: `https://example.com/ia-seed/${p.slug}/note`, label: "ノート" },
        { id: `${p.slug}-rel-3`, kind: "other", url: `https://example.com/ia-seed/${p.slug}/extra`, label: "その他" },
      ]),
    )}::jsonb`;
  }
  return `${q(
    JSON.stringify([
      { id: `${p.slug}-rel-1`, kind: "official_site", url: `https://example.com/ia-seed/${p.slug}`, label: "公式" },
    ]),
  )}::jsonb`;
}

function generate() {
  const projects = buildProjects();
  const usage = buildUsage(projects);
  const regFb = buildRegisteredFeedback(projects);
  const guestFb = buildGuestFeedback(projects);
  const logs = buildDevlogs(projects);
  const releases = buildReleaseEvents(projects);
  const announcements = buildAnnouncements();

  /** @type {any[]} */
  const empathies = [];
  /** @type {any[]} */
  const replies = [];
  let empN = 1;
  let replyN = 1;

  for (const fb of regFb) {
    const used = new Set();
    for (let e = 0; e < fb.empathy; e++) {
      const user = PLAYERS[e % PLAYERS.length];
      if (used.has(user)) continue;
      used.add(user);
      empathies.push({
        id: empId(empN++),
        projectId: fb.project.id,
        targetSource: "registered_detailed",
        targetId: fb.id,
        userId: user,
      });
    }
    if (fb.reply) {
      replies.push({
        id: replyId(replyN++),
        projectId: fb.project.id,
        targetSource: "registered_detailed",
        targetId: fb.id,
        body: "ありがとうございます。次の更新で確認します。",
      });
    }
  }
  for (const fb of guestFb) {
    const used = new Set();
    for (let e = 0; e < fb.empathy; e++) {
      const user = PLAYERS[e % PLAYERS.length];
      if (used.has(user)) continue;
      used.add(user);
      empathies.push({
        id: empId(empN++),
        projectId: fb.project.id,
        targetSource: "guest_detailed",
        targetId: fb.id,
        userId: user,
      });
    }
    if (fb.reply) {
      replies.push({
        id: replyId(replyN++),
        projectId: fb.project.id,
        targetSource: "guest_detailed",
        targetId: fb.id,
        body: "ゲストFBも参考にします。",
      });
    }
  }

  // Static validation
  const ids = projects.map((p) => p.id);
  const catCounts = {};
  for (const p of projects) catCounts[p.category] = (catCounts[p.category] || 0) + 1;
  const streamDist = { ok: 0, conditional: 0, no: 0, unset: 0 };
  for (const p of projects) streamDist[p.stream] += 1;
  const attrDist = {
    quick_try: projects.filter((p) => p.quick_try).length,
    looking_for_testers: projects.filter((p) => p.looking_for_testers).length,
    usable_for_creation: projects.filter((p) => p.usable_for_creation).length,
  };
  const assetKinds = {};
  for (const p of projects.filter((x) => x.category === "asset")) {
    for (const k of p.kinds || []) assetKinds[k] = (assetKinds[k] || 0) + 1;
  }
  const searchTerms = [
    "ローグライク",
    "ホラー好き",
    "Unity",
    "Unreal Engine",
    "Godot",
    "配信者",
    "ドット絵",
    "3Dキャラクター",
    "BGM制作",
    "短編ゲーム",
    "制作に使える",
    "配信OK",
  ];
  const searchCoverage = {};
  for (const term of searchTerms) {
    const hits = projects.filter((p) => {
      const blob = [
        p.title,
        ...(p.tags || []),
        ...(p.genres || []),
        ...(p.purpose || []),
        p.longDesc ? LONG_DESC : `${PREFIX} ${p.title}`,
      ].join(" ");
      return blob.includes(term);
    });
    searchCoverage[term] = { projectHits: hits.length, slugs: hits.map((h) => h.slug) };
  }

  const allUuids = [
    ...ids,
    ...usage.map((u) => u.id),
    ...announcements.map((a) => a.id),
    ...regFb.map((f) => f.id),
    ...guestFb.map((f) => f.id),
    ...empathies.map((e) => e.id),
    ...replies.map((r) => r.id),
    ...logs.map((l) => l.id),
    ...releases.map((r) => r.id),
  ];
  const uuidDup = allUuids.length !== new Set(allUuids).size;
  const slugDup = projects.length !== new Set(projects.map((p) => p.slug)).size;
  const usageSelf = usage.filter((u) => u.source.id === u.target.id).length;
  const usageMissing = usage.filter(
    (u) => !ids.includes(u.source.id) || !ids.includes(u.target.id),
  ).length;
  const zeroHitLeak = projects.some((p) =>
    [p.title, ...(p.tags || []), ...(p.purpose || [])].join(" ").includes(ZERO_HIT),
  );

  const ownershipBySlot = {};
  for (const p of projects) {
    const key = `ia-seed-dev-${String(p.dedicatedSlot).padStart(2, "0")}`;
    if (!ownershipBySlot[key]) ownershipBySlot[key] = { slot: p.dedicatedSlot, categories: [], projectNs: [] };
    ownershipBySlot[key].categories.push(p.category);
    ownershipBySlot[key].projectNs.push(p.n);
  }
  for (const row of Object.values(ownershipBySlot)) {
    row.categories = [...new Set(row.categories)];
  }

  const coverage = {
    generatedAt: new Date().toISOString(),
    stagingRef: STAGING_REF,
    productionRefForbidden: PROD_REF,
    existingProfileMutation: false,
    ownership: {
      mode:
        "COALESCE(dedicated auth user a1a1… if present, else hero OWNER_A/B). Auth seed SHOULD run before basic seed.",
      fallbackOwners: { OWNER_A, OWNER_B },
      dedicatedSlots: 20,
      orphanProfilesIfUnlinked: false,
      multiCategorySlots: {
        "ia-seed-dev-16": ownershipBySlot["ia-seed-dev-16"],
        "ia-seed-dev-17": ownershipBySlot["ia-seed-dev-17"],
      },
      byCreatorId: ownershipBySlot,
    },
    projects: {
      total: projects.length,
      byCategory: catCounts,
      streamPolicy: streamDist,
      attributes: attrDist,
      assetKinds,
      noImage: projects.filter((p) => p.noImage).length,
      noTagsExtra: projects.filter((p) => p.noTagsExtra).length,
      noFb: projects.filter((p) => p.noFb).length,
      noUpdate: projects.filter((p) => p.noUpdate).length,
      noLinks: projects.filter((p) => p.noLinks).length,
      noUsage: projects.filter(
        (p) =>
          !usage.some((u) => u.source.id === p.id || u.target.id === p.id),
      ).length,
      discord: projects.filter((p) => p.discord).length,
      multiLinks: projects.filter((p) => p.multiLinks).length,
      longTitle: projects.filter((p) => p.longTitle).length,
      longDesc: projects.filter((p) => p.longDesc).length,
      longCreator: projects.filter((p) => p.longCreator).length,
    },
    usageRelations: usage.length,
    feedback: {
      registered: regFb.length,
      guest: guestFb.length,
      total: regFb.length + guestFb.length,
      withReply: replies.length,
      empathyRows: empathies.length,
    },
    announcements: {
      published: announcements.filter((a) => !a.draft).length,
      draft: announcements.filter((a) => a.draft).length,
    },
    devlogs: logs.length,
    releaseEvents: releases.length,
    searchCoverage,
    zeroHitQuery: ZERO_HIT,
    zeroHitLeak,
    validation: {
      uuidDuplicate: uuidDup,
      slugDuplicate: slugDup,
      usageSelfRef: usageSelf,
      usageMissingProject: usageMissing,
      categoryMin8: Object.values(catCounts).every((c) => c >= 8),
      projectsGte40: projects.length >= 40,
      usageGte10: usage.length >= 10,
      annPublishedGte6: announcements.filter((a) => !a.draft).length >= 6,
      annDraftGte1: announcements.filter((a) => a.draft).length >= 1,
      streamAllPresent: Object.values(streamDist).every((c) => c >= 1),
      searchTermsCovered: Object.values(searchCoverage).every((s) => s.projectHits >= 1),
      existingProfileMutation: false,
      everyDedicatedSlotOwnsProject: Object.keys(ownershipBySlot).length === 20,
      multiACategoriesGte3: (ownershipBySlot["ia-seed-dev-16"]?.categories.length || 0) >= 3,
      multiBCategoriesGte3: (ownershipBySlot["ia-seed-dev-17"]?.categories.length || 0) >= 3,
      pass: false,
    },
  };
  coverage.validation.pass =
    !uuidDup &&
    !slugDup &&
    usageSelf === 0 &&
    usageMissing === 0 &&
    !zeroHitLeak &&
    coverage.validation.categoryMin8 &&
    coverage.validation.projectsGte40 &&
    coverage.validation.usageGte10 &&
    coverage.validation.annPublishedGte6 &&
    coverage.validation.annDraftGte1 &&
    coverage.validation.streamAllPresent &&
    coverage.validation.searchTermsCovered &&
    coverage.validation.everyDedicatedSlotOwnsProject &&
    coverage.validation.multiACategoriesGte3 &&
    coverage.validation.multiBCategoriesGte3;

  // ---------- SQL seed ----------
  const seed = [];
  seed.push(`-- STAGING ONLY seed — Player IA Preview evaluation data (BASIC / SQL)
-- Target ref: ${STAGING_REF}
-- DO NOT run on Production (${PROD_REF}).
--
-- NOT a supabase/migrations/* file.
-- Prerequisite schema: 076–081 applied on Staging.
--
-- Markers:
--   tag: ${TAG}
--   title prefix: ${PREFIX}
--   project UUIDs: eeeeeeee-eeee-4eee-8eee-*
--
-- Does NOT UPDATE existing developer_profiles (hero / Smoke).
-- Ownership: COALESCE(dedicated ia-seed auth user if present, else hero OWNER_A/B).
-- Recommended order: optional auth seed FIRST, then this basic seed (links ownership).
-- Without auth seed: falls back to hero owners — basic seed still succeeds.
-- Re-run safe: upsert by fixed primary keys / unique natural keys.
-- Cleanup: basic SQL cleanup FIRST, then auth cleanup (never reverse — CASCADE).
-- Generated by generate-player-ia-staging-seed.mjs

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = '${SMOKE_A}'::uuid AND visibility = 'public'
  ) THEN
    RAISE EXCEPTION
      'ABORT player-ia-staging-seed: Staging Smoke A missing — refuse (wrong project / Production?)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.projects WHERE id = '${HERO}'::uuid
  ) THEN
    RAISE EXCEPTION
      'ABORT player-ia-staging-seed: Staging hero-carousel project missing — refuse';
  END IF;

  IF to_regclass('public.platform_announcements') IS NULL
     OR to_regclass('public.project_usage_relations') IS NULL THEN
    RAISE EXCEPTION
      'ABORT player-ia-staging-seed: apply schema migrations 076–081 before this seed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'category'
  ) THEN
    RAISE EXCEPTION 'ABORT player-ia-staging-seed: projects.category missing — apply 076 first';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '${OWNER_A}'::uuid) THEN
    RAISE EXCEPTION 'ABORT: missing Staging owner A ${OWNER_A}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '${OWNER_B}'::uuid) THEN
    RAISE EXCEPTION 'ABORT: missing Staging owner B ${OWNER_B}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '${PLAYERS[0]}'::uuid) THEN
    RAISE EXCEPTION 'ABORT: missing Staging player U01 ${PLAYERS[0]} (hero-carousel players required for FB FK)';
  END IF;
END $$;

-- Allow explicit first_published_at / created_at for shelf diversity (Staging seed only).
SET LOCAL session_replication_role = 'replica';
`);

  seed.push(`INSERT INTO public.projects (
  id, owner_id, owner_name, title, creator, genre, genres, description,
  overview_introduction, phase, status, looking_for_testers, tester_slots, section, tags,
  play_url, thumbnail_url, official_url, github_url, discord_url, related_links,
  visibility, playable_version, release_status,
  category, quick_try, usable_for_creation, stream_policy, stream_policy_note,
  asset_kinds, purpose_tags, category_attributes, first_published_at, created_at, updated_at
) VALUES`);

  seed.push(
    projects
      .map((p) => {
        const tags = p.noTagsExtra ? [TAG] : [...(p.tags || []), TAG];
        const thumb = p.noImage
          ? "NULL"
          : `(SELECT thumbnail_url FROM public.projects WHERE id = '${SMOKE_A}'::uuid)`;
        const creatorExpr = creatorSql(p);
        const desc = p.longDesc ? LONG_DESC : `${PREFIX} ${p.title} — Staging専用架空作品。`;
        const kinds = p.category === "asset" ? arr(p.kinds || []) : `ARRAY[]::text[]`;
        const discord = p.discord ? q(`https://discord.gg/ia-seed-${p.slug}`) : "NULL";
        const official = p.noLinks ? "NULL" : q(`https://example.com/ia-seed/${p.slug}`);
        const github = p.multiLinks ? q(`https://example.com/ia-seed/${p.slug}/repo`) : "NULL";
        const streamNote = p.streamNote ? q(p.streamNote) : "NULL";
        const attrs = q(
          JSON.stringify({
            quickTry: !!p.quick_try,
            usableForCreation: !!p.usable_for_creation,
            streamPolicy: p.stream,
            ...(p.streamNote ? { streamPolicyNote: p.streamNote } : {}),
            ...(p.kinds ? { assetKinds: p.kinds } : {}),
            purposeTags: p.purpose || [],
          }),
        );
        const days = (p.n % 28) + 1;
        return `(
  '${p.id}'::uuid, ${ownerSql(p)},
  ${creatorExpr}, ${q(`${PREFIX} ${p.title}`)}, ${creatorExpr},
  ${q(p.genres[0])}, ${arr(p.genres)}, ${q(desc)},
  ${q(`${PREFIX} ${p.title} の紹介`)},
  'playable', 'open', ${!!p.looking_for_testers}, ${p.looking_for_testers ? 6 : "NULL"},
  ${p.looking_for_testers ? q("testers") : q("new")},
  ${arr(tags)},
  ${q(`https://example.com/ia-seed/play/${p.slug}`)},
  ${thumb}, ${official}, ${github}, ${discord}, ${relatedLinksSql(p)},
  'public', ${q(p.version)}, 'in_development',
  ${q(p.category)}, ${!!p.quick_try}, ${!!p.usable_for_creation}, ${q(p.stream)}, ${streamNote},
  ${kinds}, ${arr(p.purpose || [])}, ${attrs}::jsonb,
  now() - interval '${days} days',
  now() - interval '${days} days',
  now() - interval '${p.n % 10} hours'
)`;
      })
      .join(",\n"),
  );

  seed.push(`ON CONFLICT (id) DO UPDATE SET
  owner_id = EXCLUDED.owner_id,
  title = EXCLUDED.title,
  creator = EXCLUDED.creator,
  owner_name = EXCLUDED.owner_name,
  description = EXCLUDED.description,
  overview_introduction = EXCLUDED.overview_introduction,
  genre = EXCLUDED.genre,
  genres = EXCLUDED.genres,
  tags = EXCLUDED.tags,
  category = EXCLUDED.category,
  quick_try = EXCLUDED.quick_try,
  usable_for_creation = EXCLUDED.usable_for_creation,
  looking_for_testers = EXCLUDED.looking_for_testers,
  stream_policy = EXCLUDED.stream_policy,
  stream_policy_note = EXCLUDED.stream_policy_note,
  asset_kinds = EXCLUDED.asset_kinds,
  purpose_tags = EXCLUDED.purpose_tags,
  category_attributes = EXCLUDED.category_attributes,
  thumbnail_url = EXCLUDED.thumbnail_url,
  official_url = EXCLUDED.official_url,
  github_url = EXCLUDED.github_url,
  discord_url = EXCLUDED.discord_url,
  related_links = EXCLUDED.related_links,
  playable_version = EXCLUDED.playable_version,
  visibility = 'public',
  first_published_at = EXCLUDED.first_published_at,
  updated_at = now();
`);

  seed.push(`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.projects
    WHERE id IN ('${SMOKE_A}'::uuid, '${HERO}'::uuid)
      AND '${TAG}' = ANY (coalesce(tags, '{}'))
  ) THEN
    RAISE EXCEPTION 'Seed marker leaked onto protected projects';
  END IF;
END $$;
`);

  seed.push(`INSERT INTO public.project_usage_relations (
  id, source_project_id, target_project_id, relation_type, status, created_by, created_at, updated_at
) VALUES`);
  seed.push(
    usage
      .map(
        (u, i) => `(
  '${u.id}'::uuid, '${u.source.id}'::uuid, '${u.target.id}'::uuid,
  'used', 'published', ${projectOwnerRef(u.source.id)},
  now() - interval '${i + 1} days', now() - interval '${i + 1} days'
)`,
      )
      .join(",\n"),
  );
  seed.push(`ON CONFLICT (id) DO UPDATE SET
  status = 'published',
  relation_type = 'used',
  created_by = EXCLUDED.created_by,
  updated_at = now();
`);

  seed.push(`INSERT INTO public.platform_announcements (
  id, slug, title, body, importance, status, published_at, created_at, updated_at
) VALUES`);
  seed.push(
    announcements
      .map((a) => {
        const pub = a.draft ? "NULL" : `now() - interval '${a.daysAgo} days'`;
        return `(
  '${a.id}'::uuid, ${q(a.slug)}, ${q(`${PREFIX} ${a.title}`)}, ${q(a.body)},
  ${q(a.importance)}, ${q(a.draft ? "draft" : "published")}, ${pub},
  now() - interval '${a.daysAgo + 1} days', now() - interval '${a.daysAgo} days'
)`;
      })
      .join(",\n"),
  );
  seed.push(`ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  importance = EXCLUDED.importance,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = now();
`);

  seed.push(`INSERT INTO public.project_feedback (
  id, user_id, project_id, version_key, good_points, concerns, bugs, other_notes,
  would_replay, moderation_status, created_at, updated_at
) VALUES`);
  seed.push(
    regFb
      .map(
        (f) => `(
  '${f.id}'::uuid, '${f.user}'::uuid, ${q(f.project.id)}, ${q(f.project.version)},
  ${f.good ? q(f.good) : "NULL"}, ${f.concerns ? q(f.concerns) : "NULL"}, NULL, NULL,
  'yes', 'visible',
  now() - interval '${(f.n % 14) + 1} days',
  now() - interval '${(f.n % 14) + 1} days'
)`,
      )
      .join(",\n"),
  );
  seed.push(`ON CONFLICT (id) DO UPDATE SET
  good_points = EXCLUDED.good_points,
  concerns = EXCLUDED.concerns,
  moderation_status = 'visible',
  updated_at = now();
`);

  seed.push(`INSERT INTO public.project_guest_feedback (
  id, project_id, version_key, submitter_key,
  good_points, concerns, bugs, other_notes,
  include_in_public_aggregate, moderation_status, created_at, updated_at
) VALUES`);
  seed.push(
    guestFb
      .map((f) => {
        const vk = f.versionBump ? `${f.project.version}.1` : f.project.version;
        return `(
  '${f.id}'::uuid, ${q(f.project.id)}, ${q(vk)}, '${f.submitter}'::uuid,
  ${f.good ? q(f.good) : "NULL"}, ${f.concerns ? q(f.concerns) : "NULL"}, NULL, NULL,
  true, 'visible',
  now() - interval '${(f.n % 10) + 1} days',
  now() - interval '${(f.n % 10) + 1} days'
)`;
      })
      .join(",\n"),
  );
  seed.push(`ON CONFLICT (id) DO UPDATE SET
  good_points = EXCLUDED.good_points,
  concerns = EXCLUDED.concerns,
  include_in_public_aggregate = true,
  moderation_status = 'visible',
  updated_at = now();
`);

  if (empathies.length) {
    seed.push(`DELETE FROM public.feedback_card_empathies
WHERE id::text LIKE '88888888-8888-4888-8888-%'
   OR target_id IN (
        SELECT id FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%'
        UNION ALL
        SELECT id FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
      );`);
    seed.push(`INSERT INTO public.feedback_card_empathies (
  id, project_id, target_source, target_id, user_id, created_at
) VALUES`);
    seed.push(
      empathies
        .map(
          (e) =>
            `('${e.id}'::uuid, ${q(e.projectId)}, ${q(e.targetSource)}, '${e.targetId}'::uuid, '${e.userId}'::uuid, now())`,
        )
        .join(",\n"),
    );
    seed.push(`ON CONFLICT (id) DO NOTHING;`);
  }

  if (replies.length) {
    seed.push(`DELETE FROM public.feedback_card_replies
WHERE id::text LIKE '77777777-7777-4777-8777-%';`);
    seed.push(`INSERT INTO public.feedback_card_replies (
  id, project_id, target_source, target_id, author_id, body, created_at
) VALUES`);
    seed.push(
      replies
        .map(
          (r) =>
            `('${r.id}'::uuid, ${q(r.projectId)}, ${q(r.targetSource)}, '${r.targetId}'::uuid, ${projectOwnerRef(r.projectId)}, ${q(r.body)}, now() - interval '1 day')`,
        )
        .join(",\n"),
    );
    seed.push(`ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, author_id = EXCLUDED.author_id;`);
  }

  seed.push(`INSERT INTO public.project_devlogs (
  id, project_id, author_id, title, content, published_version, is_initial_publish,
  created_at, published_at
) VALUES`);
  seed.push(
    logs
      .map(
        (l) => `(
  '${l.id}'::uuid, ${q(l.project.id)}, ${projectOwnerRef(l.project.id)},
  ${q(l.title)}, ${q(l.content)},
  ${l.published_version ? q(l.published_version) : "NULL"},
  ${!!l.initial},
  now() - interval '${l.daysAgo} days',
  now() - interval '${l.daysAgo} days'
)`,
      )
      .join(",\n"),
  );
  seed.push(`ON CONFLICT (id) DO UPDATE SET
  author_id = EXCLUDED.author_id,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  published_version = EXCLUDED.published_version,
  is_initial_publish = EXCLUDED.is_initial_publish;
`);

  seed.push(`INSERT INTO public.project_release_events (
  id, project_id, event_type, actor_user_id, note, source, created_at
) VALUES`);
  seed.push(
    releases
      .map(
        (r) => `(
  '${r.id}'::uuid, '${r.project.id}'::uuid, 'released', ${projectOwnerRef(r.project.id)},
  ${q(`${PREFIX} release event`)}, 'studio',
  now() - interval '${r.daysAgo} days'
)`,
      )
      .join(",\n"),
  );
  seed.push(`ON CONFLICT (id) DO UPDATE SET
  note = EXCLUDED.note,
  actor_user_id = EXCLUDED.actor_user_id;
`);

  seed.push(`
SET LOCAL session_replication_role = 'origin';

COMMIT;

SELECT 'player-ia-staging-seed basic OK (no developer_profiles mutation)' AS status;
`);

  fs.writeFileSync(path.join(outDir, "player-ia-staging-seed.sql"), seed.join("\n"), "utf8");

  const cleanup = `-- STAGING ONLY cleanup — Player IA seed
-- Target ref: ${STAGING_REF}
-- DO NOT run on Production (${PROD_REF}).
--
-- Deletes ONLY seed-owned rows (fixed UUID namespaces / markers).
-- Does NOT mutate existing developer_profiles or non-seed projects.
-- After success, seed-derived row counts must be 0 (see validate SQL).
-- Run THIS before player-ia-auth-seed-cleanup.ts (auth user delete CASCADE would wipe owned projects).

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects WHERE id = '${SMOKE_A}'::uuid
  ) THEN
    RAISE EXCEPTION
      'ABORT player-ia-staging-seed-cleanup: Staging Smoke A missing — refuse';
  END IF;
END $$;

DELETE FROM public.feedback_card_replies
WHERE id::text LIKE '77777777-7777-4777-8777-%'
   OR target_id IN (
        SELECT id FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%'
        UNION ALL
        SELECT id FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
      )
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.feedback_card_empathies
WHERE id::text LIKE '88888888-8888-4888-8888-%'
   OR target_id IN (
        SELECT id FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%'
        UNION ALL
        SELECT id FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
      )
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_guest_feedback
WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%'
   OR submitter_key::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%';

DELETE FROM public.project_feedback
WHERE id::text LIKE '99999999-9999-4999-8999-%'
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_usage_relations
WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%'
   OR source_project_id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
   OR target_project_id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_devlogs
WHERE id::text LIKE '66666666-6666-4666-8666-%'
   OR project_id LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.project_release_events
WHERE id::text LIKE '55555555-5555-4555-8555-%'
   OR project_id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%';

DELETE FROM public.platform_announcements
WHERE id::text LIKE 'aaaaaaaa-aaaa-4aaa-8aaa-%'
   OR slug LIKE 'ia-seed-%'
   OR title LIKE '${PREFIX}%';

DELETE FROM public.projects
WHERE id::text LIKE 'eeeeeeee-eeee-4eee-8eee-%'
   OR (
     title LIKE '${PREFIX}%'
     AND '${TAG}' = ANY (coalesce(tags, '{}'))
   );

COMMIT;
`;
  fs.writeFileSync(path.join(outDir, "player-ia-staging-seed-cleanup.sql"), cleanup, "utf8");

  const validate = `-- STAGING ONLY validate — Player IA seed (read-only)
-- Run after basic seed (+ optional auth seed). Expect non-zero seed counts.
-- After cleanup: all seed_* counts = 0.

SELECT 'projects_total' AS check, count(*)::text AS value
FROM public.projects WHERE '${TAG}' = ANY (coalesce(tags, '{}'))
UNION ALL
SELECT 'projects_' || coalesce(category, '?'), count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (coalesce(tags, '{}'))
GROUP BY category
UNION ALL
SELECT 'usage_relations', count(*)::text
FROM public.project_usage_relations WHERE id::text LIKE 'ffffffff-ffff-4fff-8fff-%'
UNION ALL
SELECT 'feedback_registered', count(*)::text
FROM public.project_feedback WHERE id::text LIKE '99999999-9999-4999-8999-%'
UNION ALL
SELECT 'feedback_guest', count(*)::text
FROM public.project_guest_feedback WHERE id::text LIKE 'bbbbbbbb-bbbb-4bbb-8bbb-%'
UNION ALL
SELECT 'empathies', count(*)::text
FROM public.feedback_card_empathies WHERE id::text LIKE '88888888-8888-4888-8888-%'
UNION ALL
SELECT 'replies', count(*)::text
FROM public.feedback_card_replies WHERE id::text LIKE '77777777-7777-4777-8777-%'
UNION ALL
SELECT 'devlogs', count(*)::text
FROM public.project_devlogs WHERE id::text LIKE '66666666-6666-4666-8666-%'
UNION ALL
SELECT 'release_events', count(*)::text
FROM public.project_release_events WHERE id::text LIKE '55555555-5555-4555-8555-%'
UNION ALL
SELECT 'announcements_published', count(*)::text
FROM public.platform_announcements
WHERE slug LIKE 'ia-seed-%' AND status = 'published'
UNION ALL
SELECT 'announcements_draft', count(*)::text
FROM public.platform_announcements
WHERE slug LIKE 'ia-seed-%' AND status = 'draft'
UNION ALL
SELECT 'stream_ok', count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (tags) AND stream_policy = 'ok'
UNION ALL
SELECT 'stream_conditional', count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (tags) AND stream_policy = 'conditional'
UNION ALL
SELECT 'stream_no', count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (tags) AND stream_policy = 'no'
UNION ALL
SELECT 'stream_unset', count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (tags) AND stream_policy = 'unset'
UNION ALL
SELECT 'quick_try_true', count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (tags) AND quick_try = true
UNION ALL
SELECT 'looking_for_testers_true', count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (tags) AND looking_for_testers = true
UNION ALL
SELECT 'usable_for_creation_true', count(*)::text
FROM public.projects WHERE '${TAG}' = ANY (tags) AND usable_for_creation = true
UNION ALL
SELECT 'auth_seed_profiles', count(*)::text
FROM public.developer_profiles
WHERE creator_id LIKE 'ia-seed-dev-%'
UNION ALL
SELECT 'auth_profiles_owning_seed_projects', count(DISTINCT d.user_id)::text
FROM public.developer_profiles d
INNER JOIN public.projects p ON p.owner_id = d.user_id
WHERE d.creator_id LIKE 'ia-seed-dev-%'
  AND '${TAG}' = ANY (coalesce(p.tags, '{}'))
UNION ALL
SELECT 'seed_projects_owned_by_dedicated', count(*)::text
FROM public.projects p
WHERE '${TAG}' = ANY (coalesce(p.tags, '{}'))
  AND p.owner_id::text LIKE 'a1a1a1a1-a1a1-41a1-81a1-%'
UNION ALL
SELECT 'seed_projects_owned_by_fallback_hero', count(*)::text
FROM public.projects p
WHERE '${TAG}' = ANY (coalesce(p.tags, '{}'))
  AND p.owner_id IN ('${OWNER_A}'::uuid, '${OWNER_B}'::uuid)
UNION ALL
SELECT 'multi_a_categories', coalesce(string_agg(DISTINCT p.category, ',' ORDER BY p.category), '')
FROM public.developer_profiles d
INNER JOIN public.projects p ON p.owner_id = d.user_id
WHERE d.creator_id = 'ia-seed-dev-16'
  AND '${TAG}' = ANY (coalesce(p.tags, '{}'))
UNION ALL
SELECT 'multi_b_categories', coalesce(string_agg(DISTINCT p.category, ',' ORDER BY p.category), '')
FROM public.developer_profiles d
INNER JOIN public.projects p ON p.owner_id = d.user_id
WHERE d.creator_id = 'ia-seed-dev-17'
  AND '${TAG}' = ANY (coalesce(p.tags, '{}'))
UNION ALL
SELECT 'protected_smoke_a', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'FAIL' END
FROM public.projects
WHERE id = '${SMOKE_A}'::uuid AND NOT ('${TAG}' = ANY (coalesce(tags, '{}')))
UNION ALL
SELECT 'protected_hero', CASE WHEN count(*) = 1 THEN 'ok' ELSE 'FAIL' END
FROM public.projects
WHERE id = '${HERO}'::uuid AND NOT ('${TAG}' = ANY (coalesce(tags, '{}')))
UNION ALL
SELECT 'zero_hit_search', (
  SELECT count(*)::text FROM public.search_public_catalog('${ZERO_HIT}', 10)
)
UNION ALL
SELECT 'zero_hit_seed_nohit', (
  SELECT count(*)::text FROM public.search_public_catalog('seed nohit', 10)
)
UNION ALL
SELECT 'zero_hit_zzz_seed_999', (
  SELECT count(*)::text FROM public.search_public_catalog('zzz seed 999', 10)
)
UNION ALL
SELECT 'hit_tag_SE', (
  SELECT count(*)::text FROM public.search_public_catalog('SE', 10)
  WHERE result_kind = 'tag' AND title = 'SE'
)
UNION ALL
SELECT 'hit_project_SE_kit', (
  SELECT count(*)::text FROM public.search_public_catalog('SE', 20)
  WHERE result_kind = 'project' AND title LIKE '%SEキット%'
)
UNION ALL
SELECT 'se_no_service_noise', (
  SELECT count(*)::text FROM public.search_public_catalog('SE', 40)
  WHERE result_kind = 'project'
    AND title LIKE '%SEキット%' IS NOT TRUE
    AND (
      title ILIKE '%[IA Seed]%'
      OR category = 'service-app'
      OR coalesce(subtitle, '') ILIKE '%seed%'
    )
)
UNION ALL
SELECT 'hit_tag_dot_partial', (
  SELECT count(*)::text FROM public.search_public_catalog('ドット', 10)
  WHERE result_kind = 'tag' AND title = 'ドット絵'
)
UNION ALL
SELECT 'no_internal_seed_tag', (
  SELECT count(*)::text FROM public.search_public_catalog('${TAG}', 10)
  WHERE result_kind = 'tag' AND title = '${TAG}'
);
`;
  fs.writeFileSync(path.join(outDir, "player-ia-staging-seed-validate.sql"), validate, "utf8");
  fs.writeFileSync(
    path.join(outDir, "player-ia-staging-seed-coverage.json"),
    JSON.stringify(coverage, null, 2),
    "utf8",
  );

  if (!coverage.validation.pass) {
    console.error("STATIC VALIDATION FAILED", coverage.validation);
    process.exit(1);
  }
  console.log("Generated seed package. Static validation PASS.");
  console.log(JSON.stringify({
    projects: coverage.projects.total,
    byCategory: coverage.projects.byCategory,
    usage: coverage.usageRelations,
    feedback: coverage.feedback,
    announcements: coverage.announcements,
    stream: coverage.projects.streamPolicy,
    attrs: coverage.projects.attributes,
  }, null, 2));
}

generate();
