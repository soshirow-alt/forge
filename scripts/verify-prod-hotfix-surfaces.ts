/**
 * Deterministic checks for the 2026-08-11 Production hotfix candidate.
 * Includes the Production-observed 3-item FB layout case.
 * Usage: npx tsx scripts/verify-prod-hotfix-surfaces.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveFeedbackGatheringLayout } from "../lib/player-ia/feedback-gathering-layout";
import {
  resolvePlayerIaHomeFeatureCards,
  PLAYER_IA_HOME_FEATURE_CARDS,
} from "../lib/player-ia/home-feature-cards";
import {
  parseDeveloperSort,
  sortDevelopers,
  developerSearchSortOptions,
  type DeveloperSearchResult,
} from "../lib/developer-search-v0-mock-data";
import { MESSAGES_SAMPLE_THREAD } from "../lib/messages-sample-thread";
import { studioSubmitHrefForCategory } from "../lib/studio-submit-category-options";
import { studioSubmitModalHref } from "../lib/project-nurture-links";
import { PROJECT_CATEGORY_IDS } from "../lib/project-categories";
import { planStudioSubmitWrite } from "../lib/studio-submit-write-plan";
import { createEmptySubmitDraft } from "../lib/studio-submit-draft";

const ROOT = path.resolve(import.meta.dirname, "..");
function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// --- 1. FB layout: Production live had 3 candidates + always lg:grid-cols-2 ---
{
  assert.deepEqual(resolveFeedbackGatheringLayout(0), {
    show: false,
    queueSlots: 0,
    gridCols: 1,
  });
  assert.deepEqual(resolveFeedbackGatheringLayout(1), {
    show: true,
    queueSlots: 3,
    gridCols: 2,
  });
  assert.deepEqual(resolveFeedbackGatheringLayout(2), {
    show: true,
    queueSlots: 3,
    gridCols: 2,
  });
  assert.deepEqual(resolveFeedbackGatheringLayout(3), {
    show: true,
    queueSlots: 3,
    gridCols: 2,
  });
  assert.deepEqual(resolveFeedbackGatheringLayout(4), {
    show: true,
    queueSlots: 3,
    gridCols: 2,
  });
  assert.deepEqual(resolveFeedbackGatheringLayout(8), {
    show: true,
    queueSlots: 3,
    gridCols: 2,
  });

  const section = read("components/player-ia/feedback-gathering-section.tsx");
  assert.match(section, /resolveFeedbackGatheringLayout/);
  assert.match(section, /CategoryHomeHero/);
  const hero = read("components/player-ia/category-home-hero.tsx");
  assert.match(hero, /lg:grid-cols-2/);

  const assemble = read("lib/supabase/player-ia-home-db.ts");
  assert.match(assemble, /softSuppressByCategory\(input\.feedbackCandidates, 4\)/);
}

// --- 2. Creator 新着順 = created_at desc + stable id ---
{
  assert.deepEqual(
    developerSearchSortOptions.map((o) => o.id),
    ["newest", "followers", "works"],
  );
  assert.equal(developerSearchSortOptions[0]?.label, "新着順");
  assert.equal(parseDeveloperSort(null), "newest");
  assert.equal(parseDeveloperSort("recommended"), "newest");
  assert.equal(parseDeveloperSort("newest"), "newest");

  const rows: DeveloperSearchResult[] = [
    {
      id: "b",
      name: "B",
      handle: "b",
      avatar: "",
      bio: "",
      verified: false,
      isNew: false,
      inDevelopment: 0,
      completed: 0,
      followers: 1,
      genres: [],
      gameThumbs: [],
      following: false,
      newestCreatedAt: 100,
    },
    {
      id: "a",
      name: "A",
      handle: "a",
      avatar: "",
      bio: "",
      verified: false,
      isNew: false,
      inDevelopment: 0,
      completed: 0,
      followers: 9,
      genres: [],
      gameThumbs: [],
      following: false,
      newestCreatedAt: 100,
    },
    {
      id: "c",
      name: "C",
      handle: "c",
      avatar: "",
      bio: "",
      verified: false,
      isNew: false,
      inDevelopment: 0,
      completed: 0,
      followers: 3,
      genres: [],
      gameThumbs: [],
      following: false,
      newestCreatedAt: 200,
    },
  ];
  assert.deepEqual(
    sortDevelopers(rows, "newest", "desc").map((r) => r.id),
    ["c", "a", "b"],
  );

  const discovery = read("lib/discovery-public-developers.ts");
  assert.match(discovery, /newestCreatedAt: newestCreated/);
  const ts = read("lib/game-timestamp.ts");
  assert.match(ts, /game\.createdAt/);
}

// --- 3. Messages sample: text-only context, CTA-aligned copy ---
{
  assert.equal("projectThumbnailSrc" in MESSAGES_SAMPLE_THREAD.context, false);
  assert.match(
    MESSAGES_SAMPLE_THREAD.composerNote,
    /利用・コラボについてメッセージ/,
  );
  assert.match(MESSAGES_SAMPLE_THREAD.composerNote, /これはメッセージ機能のサンプルです/);
  const pane = read("components/messages-sample-thread-pane.tsx");
  assert.doesNotMatch(pane, /projectThumbnailUrl=\{sample\.context/);
  const card = read("components/consultation-context-card.tsx");
  assert.doesNotMatch(card, />作品</);
  const inbox = read("components/messages-inbox-page.tsx");
  assert.match(inbox, /consultations\.length === 0/);
  assert.match(inbox, /basePath = "\/messages"/);
  assert.match(inbox, /\/studio\/messages/);
}

// --- 4. Game hero peek heights ---
{
  const carousel = read("components/featured/featured-game-carousel.tsx");
  assert.match(carousel, /md:h-\[300px\]/);
  assert.doesNotMatch(carousel, /md:h-\[320px\]/);
  assert.match(carousel, /opacity-\[0\.28\]/);
  const card = read("components/featured/featured-game-card.tsx");
  assert.match(card, /compact \? "md:h-\[300px\]"/);
}

// --- 5. Category Home count-gated ---
{
  const resolved = resolvePlayerIaHomeFeatureCards({
    game: true,
    audio: false,
    asset: false,
    "dev-tool": true,
    "service-app": false,
  });
  const devTool = resolved.find((c) => c.id === "dev-tool")!.ctas.find(
    (c) => c.id === "spotlight",
  )!;
  assert.equal(devTool.kind, "link");
  assert.equal((devTool as { href: string }).href, "/home/dev-tool");
  const audio = resolved.find((c) => c.id === "audio")!.ctas.find(
    (c) => c.id === "spotlight",
  )!;
  assert.equal(audio.kind, "coming_soon");
  assert.equal(
    PLAYER_IA_HOME_FEATURE_CARDS.find((c) => c.id === "dev-tool")?.ctas.find(
      (c) => c.id === "spotlight",
    )?.kind,
    "coming_soon",
  );
  assert.ok(fs.existsSync(path.join(ROOT, "app/(player)/home/[category]/page.tsx")));
  const db = read("lib/supabase/player-ia-home-db.ts");
  assert.match(db, /fetchPublicCategoryPresence/);
  assert.match(db, /fetchPlayerIaCategoryHome/);
}

// --- 6. 5-category create entry ---
{
  assert.equal(studioSubmitModalHref(), "/studio/submit");
  for (const id of PROJECT_CATEGORY_IDS) {
    assert.equal(studioSubmitHrefForCategory(id), `/studio/submit?category=${id}`);
  }
  const submitPage = read("app/studio/submit/page.tsx");
  assert.match(submitPage, /if \(!category\)/);
  assert.match(submitPage, /StudioSubmitCategoryPick/);
  assert.match(submitPage, /projectCategory="game"/);
  const gameDraft = createEmptySubmitDraft();
  gameDraft.title = "planner game";
  gameDraft.description = "catchcopy";
  gameDraft.introduction = "intro text";
  gameDraft.phase = "playable";
  gameDraft.genres = ["RPG"];
  gameDraft.playAccessType = "free";
  gameDraft.publishDestinations = [
    {
      id: "pub-1",
      kind: "other",
      url: "https://example.com/play",
      usageMethod: "other",
      isPrimary: true,
    },
  ];
  const plannedGame = planStudioSubmitWrite({
    draft: gameDraft,
    owner: {
      ownerId: "11111111-1111-4111-8111-111111111111",
      ownerName: "Tester",
      creator: "Tester",
    },
    projectCategory: "game",
  });
  assert.equal(plannedGame.category, "game");
}

// --- 7. Studio メッセージ replaces マイコミュニティ ---
{
  const shell = read("components/studio-shell.tsx");
  assert.match(shell, /href="\/studio\/messages"/);
  assert.match(shell, />\s*メッセージ\s*</);
  assert.doesNotMatch(shell, /マイコミュニティ/);
  assert.doesNotMatch(shell, /href="\/studio\/community"/);
  const community = read("app/studio/community/page.tsx");
  assert.match(community, /redirect\("\/studio\/messages"\)/);
  assert.doesNotMatch(community, /redirect\("\/studio"\)/);
  assert.ok(fs.existsSync(path.join(ROOT, "app/studio/messages/page.tsx")));
  assert.ok(fs.existsSync(path.join(ROOT, "app/studio/messages/[id]/page.tsx")));
  const studioMessages = read("app/studio/messages/page.tsx");
  assert.match(studioMessages, /basePath="\/studio\/messages"/);
  assert.match(studioMessages, /MessagesInboxPage/);
  const playerMessages = read("app/(player)/messages/page.tsx");
  assert.match(playerMessages, /MessagesInboxPage/);
  const inbox = read("components/messages-inbox-page.tsx");
  assert.match(inbox, /\/api\/collab\/consultations/);
  const thread = read("components/consultation-thread.tsx");
  assert.match(thread, /\$\{basePath\}\?notice=unavailable/);
  assert.match(thread, /\$\{basePath\}\/\$\{nextId\}/);
  assert.match(thread, /returnPath=\{\`\$\{basePath\}\/\$\{consultationId\}\`\}/);
  assert.doesNotMatch(thread, /router\.replace\("\/messages/);
  assert.doesNotMatch(thread, /returnPath=\{\`\/messages\//);
  const onboarding = read("components/developer-page-onboarding-modal.tsx");
  assert.doesNotMatch(onboarding, /マイコミュニティ/);
  const notify = read("lib/studio-notifications-v0-mock-data.ts");
  assert.doesNotMatch(notify, /\/studio\/community/);
  const metrics = read("lib/studio-home-metrics.ts");
  assert.doesNotMatch(metrics, /\/studio\/community/);
  assert.equal(fs.existsSync(path.join(ROOT, "components/studio-community-page.tsx")), false);

  const scanRoots = ["app", "components", "lib", "hooks"];
  const leftoverCommunity: string[] = [];
  const leftoverLabel: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const rel = path.relative(ROOT, full).replaceAll("\\", "/");
      if (rel === "app/studio/community/page.tsx") continue;
      const src = fs.readFileSync(full, "utf8");
      if (src.includes("/studio/community")) leftoverCommunity.push(rel);
      if (src.includes("マイコミュニティ")) leftoverLabel.push(rel);
    }
  }
  for (const root of scanRoots) walk(path.join(ROOT, root));
  assert.deepEqual(leftoverCommunity, [], `dead /studio/community leftovers: ${leftoverCommunity.join(", ")}`);
  assert.deepEqual(leftoverLabel, [], `dead マイコミュニティ leftovers: ${leftoverLabel.join(", ")}`);
}

console.log("verify-prod-hotfix-surfaces: PASS");
