/**
 * First-time /guide: terminology, 5-category labels, real routes, Player/Studio messages.
 * Usage: npx tsx scripts/verify-first-guide.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  FIRST_GUIDE_CATEGORY_LABELS,
  FIRST_GUIDE_ROUTE_PATHS,
  firstGuideIntro,
  firstGuideSections,
  playerGuideStudioEntry,
} from "../lib/player-guide-v0-content";
import { PROJECT_CATEGORY_LABELS } from "../lib/project-categories";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function pageExists(pathname: string): boolean {
  const rel = pathname.replace(/^\//, "");
  const candidates = [
    path.join(ROOT, "app", rel, "page.tsx"),
    path.join(ROOT, "app", "(player)", rel, "page.tsx"),
    path.join(ROOT, "app", "studio", rel.replace(/^studio\/?/, ""), "page.tsx"),
  ];
  if (pathname === "/home/dev-tool" || pathname === "/home/audio" || pathname === "/home/asset") {
    candidates.push(path.join(ROOT, "app", "(player)", "home", "[category]", "page.tsx"));
  }
  if (pathname === "/studio") {
    candidates.push(path.join(ROOT, "app", "studio", "page.tsx"));
  }
  return candidates.some((file) => fs.existsSync(file));
}

const content = read("lib/player-guide-v0-content.ts");
const page = read("components/player-guide-page.tsx");
const studioEntry = read("components/guide-studio-entry-section.tsx");
const studioGuide = read("components/studio-guide-page.tsx");
const visible = [
  firstGuideIntro.title,
  firstGuideIntro.lead,
  ...firstGuideSections.flatMap((section) => [
    section.title,
    ...section.body,
    ...(section.bullets ?? []),
    section.note ?? "",
    ...(section.ctas ?? []).map((cta) => cta.label),
  ]),
  playerGuideStudioEntry.title,
  playerGuideStudioEntry.lead,
  playerGuideStudioEntry.body,
  playerGuideStudioEntry.caption,
].join("\n");

assert.equal(firstGuideSections.length, 7);
assert.deepEqual(
  firstGuideSections.map((section) => section.id),
  [
    "what-is-forge",
    "find",
    "try-feedback",
    "publish",
    "connect",
    "reciprocity",
    "player-studio",
  ],
);
assert.deepEqual(
  [...FIRST_GUIDE_CATEGORY_LABELS],
  ["ゲーム", "音楽・音声", "アセット", "開発ツール", "サービス"],
);
assert.equal(PROJECT_CATEGORY_LABELS["service-app"], "サービス");
assert.match(visible, /ゲーム/);
assert.match(visible, /音楽・音声/);
assert.match(visible, /アセット/);
assert.match(visible, /開発ツール/);
assert.match(visible, /サービス/);
assert.doesNotMatch(visible, /サービス・アプリ/);
assert.doesNotMatch(visible, /service-app/);
assert.doesNotMatch(visible, /Service App/i);
console.log("OK  5-category labels");

assert.match(visible, /見つける/);
assert.match(visible, /フィードバック/);
assert.match(visible, /ログインが必要/);
assert.match(visible, /ゲストのままフィードバックを送ることは、現在の本番ではできません/);
assert.doesNotMatch(visible, /声を届ける|みんなの声|プレイヤーの声|届けた声|初声/);
assert.doesNotMatch(visible, /(?<!音)声(?!明)/);
assert.doesNotMatch(visible, /最新版|次版|この版|N版|版ごとの/);
assert.doesNotMatch(visible, /正式ver/);
assert.doesNotMatch(visible, /開発者/);
assert.doesNotMatch(visible, /マイコミュニティ/);
assert.doesNotMatch(visible, /おすすめ順/);
console.log("OK  feedback + terminology");

assert.match(visible, /クリエイター/);
assert.match(visible, /新規投稿/);
assert.match(visible, /Studio/);
assert.match(visible, /メッセージ/);
assert.match(visible, /使用関係/);
assert.match(visible, /利用・コラボ/);
assert.match(visible, /ライセンスや著作権の譲渡、報酬契約そのものではありません/);
assert.match(visible, /ポイントやクレジット、必ずお返ししなければならない仕組みではありません/);
assert.match(
  visible,
  /Player のメッセージと Studio のメッセージは、別の会話ではありません/,
);
assert.match(visible, /クリエイターでなくても、試してフィードバックする人が中心の利用者です/);
assert.match(visible, /クリエイター同士だけの場所ではありません/);
console.log("OK  publish / messages / reciprocity / Player-Studio");

const hrefs = firstGuideSections.flatMap((section) =>
  (section.ctas ?? []).map((cta) => cta.href.split("?")[0]!),
);
assert.ok(hrefs.includes("/home"));
assert.ok(hrefs.includes("/search"));
assert.ok(hrefs.includes("/search/creators"));
assert.ok(hrefs.includes("/studio/submit"));
assert.ok(hrefs.includes("/messages"));
assert.ok(hrefs.includes("/studio"));
assert.ok(hrefs.includes("/usage-relations"));
assert.ok(hrefs.includes("/terms"));
assert.ok(!hrefs.includes("/studio/community"));
assert.ok(!hrefs.includes("/consultations"));
assert.ok(!hrefs.includes("/landing"));
assert.ok(!hrefs.includes("/mypage/community"));

for (const href of new Set([...hrefs, ...FIRST_GUIDE_ROUTE_PATHS])) {
  assert.ok(pageExists(href), `dead route in guide: ${href}`);
}
assert.match(page, /firstGuideSections/);
assert.doesNotMatch(page, /href=\{?["']\/home["']\s*\|\|/);
assert.doesNotMatch(content, /fallback.*\/home|\/home.*fallback/);
assert.doesNotMatch(page, /playerGuideFaq|playerGuideSteps/);
assert.doesNotMatch(visible, /フォロー中の開発者/);
console.log("OK  routes + no dead-link fallback");

assert.match(studioEntry, /playerGuideStudioEntry/);
assert.doesNotMatch(studioEntry, /開発者/);
assert.match(studioGuide, /href=["']\/guide["']/);
assert.match(studioGuide, /正式版公開/);
assert.doesNotMatch(studioGuide, /正式ver/);
assert.doesNotMatch(studioGuide, /ゲームを短いサイクル/);
assert.doesNotMatch(studioGuide, /マイコミュニティ/);
console.log("OK  Studio guide alignment");

assert.match(read("app/guide/page.tsx"), /PlayerGuidePage/);
assert.match(read("app/api/projects/[projectId]/guest-feedback/route.ts"), /VERCEL_ENV === "production"/);
assert.match(
  read("app/api/projects/[projectId]/guest-feedback/route.ts"),
  /guest_feedback_disabled/,
);
console.log("OK  Production guest FB still login-gated");

console.log("verify-first-guide ok");
