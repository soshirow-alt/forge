/**
 * Landing Page 5-category meaning update — copy / structure contracts (no redesign).
 * Run: npx --yes tsx scripts/verify-landing-five-category-copy.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const landing = read("components/landing-page.tsx");
const page = read("app/page.tsx");
const featured = read("components/landing-featured-games-section.tsx");

// Hero
assert.match(landing, /作品を、/);
assert.match(landing, /text-violet-300">育てる/);
assert.match(landing, /whitespace-nowrap">場所。/);
assert.doesNotMatch(landing, /ゲームを、/);
assert.match(landing, /作品を見つけて、試して、感じたことを届ける。/);
assert.match(landing, /そこから、作品の変化や新しいつながりが生まれる。/);
assert.doesNotMatch(landing, /最高のゲーム体験/);
assert.doesNotMatch(landing, /作品を公開して、試してもらう/);

// Left 3 value props (structure preserved)
assert.match(landing, /見つけて、試す/);
assert.match(landing, /感じたことを、届ける/);
assert.match(landing, /作品から、つながる/);
assert.match(landing, /MessageSquare/);
assert.match(landing, /TrendingUp/);
assert.match(landing, /Heart/);
assert.match(landing, /bg-violet-500\/20 text-violet-300/);
assert.match(landing, /bg-emerald-500\/20 text-emerald-300/);
assert.match(landing, /bg-amber-500\/20 text-amber-300/);

// Right CTA cards
assert.match(landing, /作品を楽しむあなたへ/);
assert.match(landing, /作品を見つける/);
assert.match(landing, /気になる作品を見つけて試し/);
assert.match(landing, /作品を探す/);
assert.match(landing, /クリエイターのあなたへ/);
assert.match(landing, /作品を掲載する/);
assert.match(landing, /試してくれる人と一緒に育てていきましょう/);
assert.match(landing, /Studioに入る/);
assert.doesNotMatch(landing, /プレイヤーのあなたへ/);
assert.doesNotMatch(landing, /開発者のあなたへ/);
assert.doesNotMatch(landing, /開発者としてはじめる/);
assert.doesNotMatch(landing, /プレイヤーとして参加/);

// 5-category section — icon + label cards (CtaCard glow language), no weak blurbs
assert.match(landing, /いろんな作品が、Forgeに。/);
assert.match(landing, /PROJECT_CATEGORY_LABELS/);
assert.match(landing, /Gamepad2/);
assert.match(landing, /Headphones/);
assert.match(landing, /Box/);
assert.match(landing, /Code2/);
assert.match(landing, /LayoutGrid/);
assert.match(landing, /from-violet-500\/20/);
assert.match(landing, /ring-violet-500\/25/);
assert.doesNotMatch(landing, /遊んで、感じたことを届ける/);
assert.doesNotMatch(landing, /聴いて、作品や制作につなげる/);
assert.match(landing, /lg:grid-cols-5/);
assert.match(landing, /sm:grid-cols-2/);
assert.doesNotMatch(landing, /サービス・アプリ/);
assert.match(landing, /id: "game"/);
assert.match(landing, /id: "service-app"/);

const guestCta = read("components/landing-guest-entry-button.tsx");
assert.match(guestCta, /ゲストで参加/);
assert.doesNotMatch(guestCta, /ゲストで作品を見る/);

// Featured heading already neutral
assert.match(featured, /注目の開発中作品/);
assert.doesNotMatch(featured, /注目の開発中ゲーム/);

// Metadata + OGP on `/`
assert.match(page, /Forge — 作品を、育てる場所。/);
assert.match(page, /ゲーム・音楽・音声・アセット・開発ツール・サービス/);
assert.match(page, /openGraph/);
assert.doesNotMatch(page, /最高のゲーム体験/);
assert.doesNotMatch(page, /Forge — ゲームを、育てる場所。/);

// Layout geometry anchors (no redesign)
assert.match(landing, /max-w-\[1320px\]/);
assert.match(landing, /lg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,760px\)\]/);
assert.match(landing, /hero-bg\.png/);
assert.match(landing, /accent="player"/);
assert.match(landing, /accent="developer"/);

console.log("verify-landing-five-category-copy: PASS");
