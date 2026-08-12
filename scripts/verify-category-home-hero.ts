/**
 * Shared category Home hero + whole-Home FB 4-slot fill.
 *
 * Usage: npx tsx scripts/verify-category-home-hero.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  fillCategoryHomeHeroWorks,
  planCategoryHomeHero,
  resolveCategoryHomeHeroActiveIndex,
  resolveCategoryHomeHeroRail,
} from "../lib/player-ia/category-home-hero";
import {
  compareFeedbackGatheringFill,
  extraFromPublicFeedbackCards,
  mergeFeedbackGatheringFill,
  resolveFillAuthorCount,
} from "../lib/player-ia/feedback-gathering-fill";
import { resolveFeedbackGatheringLayout } from "../lib/player-ia/feedback-gathering-layout";
import type { HomeFeedbackGatheringProject } from "../lib/supabase/player-ia-home-db";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function fb(
  id: string,
  extras?: Partial<HomeFeedbackGatheringProject>,
): HomeFeedbackGatheringProject {
  return {
    projectId: id,
    title: id,
    category: "game",
    description: "",
    thumbnail: "",
    windowDays: 90,
    distinctAuthorCount: 2,
    feedbackCount: 3,
    hasCreatorReply: false,
    lastFeedbackAt: "2026-07-01T00:00:00Z",
    ...extras,
  };
}

// --- slot / placeholder plan ---
{
  const empty = planCategoryHomeHero([]);
  assert.equal(empty.reals.length, 0);
  assert.equal(empty.canRotate, false);
  assert.equal(empty.showDots, false);

  const one = planCategoryHomeHero(["a"]);
  assert.deepEqual(one.reals, ["a"]);
  assert.equal(one.canRotate, false);
  assert.equal(one.showDots, false);
  assert.equal(one.placeholderCount, 3);
  const oneRail = resolveCategoryHomeHeroRail(["a"], 0);
  assert.equal(oneRail?.hero, "a");
  assert.deepEqual(
    oneRail?.right.map((slot) => slot.kind),
    ["placeholder", "placeholder", "placeholder"],
  );

  const two = planCategoryHomeHero(["a", "b"]);
  assert.equal(two.canRotate, true);
  assert.equal(two.showDots, true);
  assert.equal(two.placeholderCount, 2);
  const twoRail = resolveCategoryHomeHeroRail(["a", "b"], 0);
  assert.equal(twoRail?.hero, "a");
  assert.equal(twoRail?.right[0]?.kind, "real");
  if (twoRail?.right[0]?.kind === "real") {
    assert.equal(twoRail.right[0].item, "b");
  }
  assert.equal(twoRail?.right[1]?.kind, "placeholder");
  assert.equal(twoRail?.right[2]?.kind, "placeholder");

  const threeRail = resolveCategoryHomeHeroRail(["a", "b", "c"], 1);
  assert.equal(threeRail?.hero, "b");
  assert.deepEqual(
    threeRail?.right.map((slot) =>
      slot.kind === "real" ? slot.item : "ph",
    ),
    ["a", "c", "ph"],
  );

  const fourRail = resolveCategoryHomeHeroRail(["a", "b", "c", "d"], 0);
  assert.equal(fourRail?.hero, "a");
  assert.deepEqual(
    fourRail?.right.map((slot) =>
      slot.kind === "real" ? slot.item : "ph",
    ),
    ["b", "c", "d"],
  );
  assert.ok(fourRail?.right.every((slot) => slot.kind === "real"));

  const capped = planCategoryHomeHero(["a", "b", "c", "d", "e"]);
  assert.deepEqual(capped.reals, ["a", "b", "c", "d"]);

  assert.equal(resolveCategoryHomeHeroActiveIndex(1, 9), 0);
  assert.equal(resolveCategoryHomeHeroActiveIndex(3, -1), 2);
  console.log("OK  category hero 0/1/2/3/4 slot + placeholder plan");
}

// --- placeholders never active ---
{
  const reals = ["a", "b"];
  for (let i = 0; i < 6; i += 1) {
    const rail = resolveCategoryHomeHeroRail(reals, i);
    assert.ok(rail);
    assert.ok(reals.includes(rail.hero));
    const activeIds = [
      rail.hero,
      ...rail.right
        .filter((slot) => slot.kind === "real")
        .map((slot) => (slot.kind === "real" ? slot.item : "")),
    ];
    assert.ok(activeIds.every((id) => reals.includes(id)));
  }
  console.log("OK  placeholders never enter active/left hero");
}

// --- Home FB fill: 30d/90d first, then ≥1 FB extras, no dupes ---
{
  const ranked = [
    fb("skank", { feedbackCount: 3, lastFeedbackAt: "2026-07-16T16:42:00Z" }),
    fb("slime", { feedbackCount: 3, lastFeedbackAt: "2026-07-16T16:40:00Z" }),
    fb("nu", { feedbackCount: 2, lastFeedbackAt: "2026-07-04T14:21:00Z" }),
  ];
  const extras = [
    fb("realia", {
      feedbackCount: 1,
      distinctAuthorCount: 1,
      lastFeedbackAt: "2026-07-15T07:16:00Z",
    }),
    fb("minzoku", {
      feedbackCount: 1,
      distinctAuthorCount: 1,
      lastFeedbackAt: "2026-07-16T16:53:00Z",
    }),
    fb("momiji", {
      feedbackCount: 1,
      distinctAuthorCount: 1,
      lastFeedbackAt: "2026-07-06T18:25:00Z",
    }),
    fb("zero", { feedbackCount: 0, distinctAuthorCount: 0 }),
    fb("skank", { feedbackCount: 9, lastFeedbackAt: "2026-08-01T00:00:00Z" }),
  ];
  const filled = mergeFeedbackGatheringFill(ranked, extras, 4);
  assert.deepEqual(
    filled.map((item) => item.projectId),
    ["skank", "slime", "nu", "minzoku"],
  );
  assert.equal(new Set(filled.map((item) => item.projectId)).size, 4);
  assert.ok(filled.every((item) => item.feedbackCount >= 1));

  const strictThree = ranked.slice();
  assert.equal(strictThree.length, 3);
  assert.ok(compareFeedbackGatheringFill(extras[1]!, extras[0]!) < 0);

  const fourPlus = mergeFeedbackGatheringFill(
    [...ranked, fb("fourth-windowed")],
    extras,
    4,
  );
  assert.deepEqual(
    fourPlus.map((item) => item.projectId),
    ["skank", "slime", "nu", "fourth-windowed"],
  );

  assert.deepEqual(resolveFeedbackGatheringLayout(3).queueSlots, 3);
  assert.deepEqual(resolveFeedbackGatheringLayout(4).queueSlots, 3);

  const sameAuthorFive = extraFromPublicFeedbackCards(
    {
      projectId: "multi",
      title: "multi",
      category: "game",
      description: "",
      thumbnail: "",
      fallbackLastAt: "2026-01-01T00:00:00Z",
    },
    Array.from({ length: 5 }, (_, i) => ({
      cardId: `c${i}`,
      createdAt: `2026-07-0${i + 1}T00:00:00Z`,
      authorKind: "registered",
      authorKey: "user-same",
    })),
    1,
  );
  const sameNameDifferentUsers = extraFromPublicFeedbackCards(
    {
      projectId: "dup-name",
      title: "dup-name",
      category: "game",
      description: "",
      thumbnail: "",
      fallbackLastAt: "2026-01-01T00:00:00Z",
    },
    [
      {
        cardId: "a1",
        createdAt: "2026-07-10T00:00:00Z",
        authorKind: "registered",
        authorKey: "user-a",
      },
      {
        cardId: "a2",
        createdAt: "2026-07-11T00:00:00Z",
        authorKind: "registered",
        authorKey: "user-b",
      },
    ],
    2,
  );
  const renamedSameUser = extraFromPublicFeedbackCards(
    {
      projectId: "renamed",
      title: "renamed",
      category: "game",
      description: "",
      thumbnail: "",
      fallbackLastAt: "2026-01-01T00:00:00Z",
    },
    [
      {
        cardId: "r1",
        createdAt: "2026-07-08T00:00:00Z",
        authorKind: "registered",
        authorKey: "user-same",
      },
      {
        cardId: "r2",
        createdAt: "2026-07-09T00:00:00Z",
        authorKind: "registered",
        authorKey: "user-same",
      },
    ],
    1,
  );
  const guestOnly = extraFromPublicFeedbackCards(
    {
      projectId: "guest",
      title: "guest",
      category: "game",
      description: "",
      thumbnail: "",
      fallbackLastAt: "2026-01-01T00:00:00Z",
    },
    [
      {
        cardId: "g1",
        createdAt: "2026-07-20T00:00:00Z",
        authorKind: "guest",
        authorKey: "guest:submitter-1",
      },
    ],
    0,
  );
  assert.equal(sameAuthorFive?.feedbackCount, 5);
  assert.equal(sameAuthorFive?.distinctAuthorCount, 1);
  assert.equal(sameNameDifferentUsers?.distinctAuthorCount, 2);
  assert.equal(renamedSameUser?.distinctAuthorCount, 1);
  assert.equal(
    resolveFillAuthorCount({
      participantCount: 2,
      guestSubmitterKeys: ["guest-a", "guest-b", "guest-a"],
    }),
    4,
  );
  const mixed = extraFromPublicFeedbackCards(
    {
      projectId: "mixed",
      title: "mixed",
      category: "game",
      description: "",
      thumbnail: "",
      fallbackLastAt: "2026-01-01T00:00:00Z",
    },
    [
      {
        cardId: "m1",
        createdAt: "2026-07-18T00:00:00Z",
        authorKind: "registered",
      },
      {
        cardId: "m2",
        createdAt: "2026-07-19T00:00:00Z",
        authorKind: "guest",
      },
    ],
    1,
    ["guest-a"],
  );
  assert.equal(mixed?.feedbackCount, 2);
  assert.equal(mixed?.distinctAuthorCount, 2);
  assert.equal(guestOnly?.feedbackCount, 1);
  assert.ok(guestOnly);
  assert.ok(
    compareFeedbackGatheringFill(sameAuthorFive!, guestOnly!) < 0,
    "5 FB from one author ranks above 1 guest FB",
  );
  assert.equal(
    extraFromPublicFeedbackCards(
      {
        projectId: "none",
        title: "none",
        category: "game",
        description: "",
        thumbnail: "",
        fallbackLastAt: "2026-01-01T00:00:00Z",
      },
      [],
      5,
    ),
    null,
    "empty cards must not invent a fill row from participant count",
  );

  const db = read("lib/supabase/player-ia-home-db.ts");
  assert.match(db, /feedback fill failed/);
  assert.match(db, /return ranked/);
  assert.match(db, /extraFromPublicFeedbackCards/);
  assert.doesNotMatch(db, /FILL_CARD_FETCH_LIMIT|slice\(0, 16\)/);
  assert.match(db, /if \(cards\.length < 1\) return null/);
  assert.match(db, /fetchAllPublicCatalog/);
  assert.match(db, /fetchGuestSubmitterKeys/);
  assert.match(db, /fetchPublicFeedbackCardsForHomeFill/);
  assert.doesNotMatch(db, /listProjectIdsWithVisibleFeedbackSignals/);
  assert.doesNotMatch(
    db,
    /fillFeedbackGatheringFromPublicWorks[\s\S]*fetchPublicFeedbackCardsEnriched/,
  );
  assert.match(db, /offset \+= pageSize/);
  console.log("OK  Home FB 3 strict + 4th fallback; 4+ stays 4 reals");
}

// --- category hero fill does not use FB ranking ---
{
  const featured = [
    { projectId: "f1", title: "F1", description: "", category: "game" as const },
    { projectId: "f2", title: "F2", description: "", category: "game" as const },
    { projectId: "f3", title: "F3", description: "", category: "game" as const },
  ];
  const newest = [
    { projectId: "n1", title: "N1", description: "", category: "game" as const },
    { projectId: "f1", title: "dup", description: "", category: "game" as const },
  ];
  const works = fillCategoryHomeHeroWorks(featured, newest, 4);
  assert.deepEqual(
    works.map((item) => item.projectId),
    ["f1", "f2", "f3", "n1"],
  );
  console.log("OK  category hero fill separate from FB ranking");
}

// --- presentation shared, game metadata does not leak ---
{
  const gameHome = read("components/player-ia/player-ia-game-home-page.tsx");
  const categoryHome = read(
    "components/player-ia/player-ia-category-home-page.tsx",
  );
  const workCards = read("components/player-ia/category-home-work-cards.tsx");
  const hero = read("components/player-ia/category-home-hero.tsx");
  const fbSection = read("components/player-ia/feedback-gathering-section.tsx");
  const placeholder = read("components/player-ia/category-home-placeholder.tsx");
  const db = read("lib/supabase/player-ia-home-db.ts");

  assert.match(gameHome, /CategoryHomeHero/);
  assert.match(categoryHome, /CategoryHomeHero/);
  assert.match(fbSection, /CategoryHomeHero/);
  assert.doesNotMatch(gameHome, /FeaturedGameCarousel|NeighborPeek/);
  assert.match(hero, /plan\.canRotate/);
  assert.match(hero, /plan\.showDots/);
  assert.match(hero, /kind === "placeholder"/);
  assert.match(hero, /HOME_HERO_GRID_CLASS/);
  assert.match(hero, /resolveHomeHeroQueueRowHeight/);
  assert.match(hero, /ResizeObserver/);
  assert.doesNotMatch(workCards, /aspect-\[16\/10\]|w-\[42%\]/);
  assert.doesNotMatch(fbSection, /aspect-\[16\/10\]|w-\[42%\]/);
  assert.match(workCards, /HOME_HERO_QUEUE_THUMB_BOX_CLASS/);
  assert.match(placeholder, /HOME_HERO_PLACEHOLDER_THUMB_BOX_CLASS/);
  assert.doesNotMatch(placeholder, /href=|gameDetailHref/);
  assert.match(placeholder, /role="presentation"/);
  assert.match(placeholder, /CATEGORY_HOME_HERO_PLACEHOLDER_COPY/);
  const heroLib = read("lib/player-ia/category-home-hero.ts");
  assert.match(heroLib, /このカテゴリの次の作品を待っています/);

  assert.match(workCards, /item\.category === "game" && item\.genre/);
  assert.doesNotMatch(workCards, /プレイする|playPlayerCount|play_time|想定時間/);
  assert.doesNotMatch(categoryHome, /プレイする|playPlayerCount|ジャンル/);
  assert.doesNotMatch(gameHome, /プレイする/);
  assert.match(gameHome, /Coming Soon/);
  assert.match(gameHome, /詳細を見る/);
  assert.match(categoryHome, /詳細を見る/);
  assert.match(fbSection, /フィードバックを見る/);
  assert.doesNotMatch(fbSection, /FB募集中/);

  assert.match(db, /fillFeedbackGatheringFromPublicWorks/);
  assert.match(db, /mergeFeedbackGatheringFill/);
  assert.match(db, /heroWorks/);
  assert.match(db, /fillCategoryHomeHeroWorks/);
  const gameHomeFn = db.slice(
    db.indexOf("export async function fetchPlayerIaGameHome"),
    db.indexOf("export async function fetchPublicCategoryPresence"),
  );
  assert.doesNotMatch(gameHomeFn, /get_home_feedback_gathering_projects/);
  assert.doesNotMatch(gameHomeFn, /fillFeedbackGatheringFromPublicWorks/);
  console.log("OK  shared shell + metadata split + no FB募集中");
}

// --- Overview IA kept ---
{
  const overview = read("components/game-detail-player-overview.tsx");
  assert.match(overview, /data-play-time-chips="3-2"/);
  assert.match(overview, /公開・配布|OVERVIEW_PUBLICATION_TITLE/);
  const display = read("lib/overview-distribution-display.ts");
  assert.match(display, /外部ページ/);
  assert.match(display, /GENERIC_EXTERNAL_PAGE/);
  console.log("OK  Overview IA kept");
}

console.log("verify-category-home-hero ok");
