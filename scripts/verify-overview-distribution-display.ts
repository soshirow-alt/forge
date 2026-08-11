/**
 * Overview IA: 公開・配布 / 関連リンク / 遊び方非表示 / 想定時間 3+2 / 5カテゴリ.
 * Usage: npx tsx scripts/verify-overview-distribution-display.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GameDetailPlayerOverview } from "../components/game-detail-player-overview";
import type { GameDetailV0 } from "../lib/game-detail-v0-mock-data";
import {
  resolveGameDetailPlayerMeta,
  type GameDetailOverviewActivity,
  type GameDetailPlayerMeta,
} from "../lib/game-detail-player-meta";
import { resolvePlayDestinations } from "../lib/game-play-destinations";
import type { Game } from "../lib/mock-games";
import {
  GENERIC_BROWSER,
  GENERIC_DIRECT_DOWNLOAD,
  GENERIC_EXTERNAL_PAGE,
  GENERIC_EXTERNAL_STORE,
  OVERVIEW_PUBLICATION_TITLE,
  RELATED_LINK_UNLABELED,
  inferKnownPlatformLabel,
  isTechnicalDistributionHost,
  overviewRelatedLinkIdentity,
  resolveOverviewDistributionLabel,
  resolveOverviewDistributionLabelForGame,
} from "../lib/overview-distribution-display";
import { PLAY_TIME_OPTIONS } from "../lib/play-time-options";
import {
  DIST_DOWNLOAD_TAG,
  DIST_EXTERNAL_TAG,
  ENV_PC_TAG,
} from "../lib/play-environment";
import { resolveProjectDetailCategoryChrome } from "../lib/project-detail-category-chrome";
import {
  createEmptyPublishDestination,
  createEmptyRelatedLink,
  toRelatedLinkDisplays,
} from "../lib/project-publish-links";

const ROOT = path.resolve(import.meta.dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function baseGame(overrides: Partial<Game> = {}): Game {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "検証作品",
    genre: "アクション",
    genres: ["アクション"],
    status: "試作ver",
    creator: "検証",
    phase: "playable",
    description: "リード文",
    lookingForTesters: false,
    lastUpdated: "2026-08-12",
    section: "new",
    tags: [ENV_PC_TAG, DIST_DOWNLOAD_TAG],
    playUrl: "https://example.com/file.zip",
    estimatedPlayTime: "15〜30分",
    playAccessType: "free",
    overviewIntroduction: "紹介本文",
    category: "game",
    ...overrides,
  };
}

const detailGame: GameDetailV0 = {
  id: "overview-verify",
  title: "検証作品",
  lead: "リード文",
  tags: ["アクション"],
  heroImage: "/images/landing/game-1.png",
  galleryImages: ["/images/landing/game-1.png"],
  currentVersion: "v1",
  developer: {
    id: "dev",
    name: "検証",
    avatar: "/images/landing/game-2.png",
    followers: 0,
    bio: "",
    following: false,
  },
  witnessCount: 0,
  voiceCount: 1,
  devlogUpdatedAgo: "—",
  lastUpdated: "2026-08-12",
  watching: false,
  saved: false,
  introduction: "紹介本文",
  features: [],
  developerWorry: "",
  wantedVoices: [],
  relatedTags: [],
  relatedGames: [],
};

const activity: GameDetailOverviewActivity = {
  lastUpdated: "2026-08-12",
  hasDevlog: false,
  devlogLabel: "",
  voiceCount: 1,
  statsLoaded: true,
};

function playerMetaFor(game: Game): GameDetailPlayerMeta {
  const meta = resolveGameDetailPlayerMeta(game);
  assert.ok(meta);
  return meta;
}

// --- 1. known platforms from existing data / URL ---
{
  assert.equal(inferKnownPlatformLabel("https://play.unity.com/game/demo"), "Unity Play");
  assert.equal(inferKnownPlatformLabel("https://studio.itch.io/demo"), "itch.io");
  assert.equal(
    inferKnownPlatformLabel("https://store.steampowered.com/app/1"),
    "Steam",
  );
  assert.equal(inferKnownPlatformLabel("https://foo.booth.pm/items/1"), "BOOTH");
  assert.equal(inferKnownPlatformLabel("https://github.com/acme/tool"), "GitHub");
  assert.equal(
    inferKnownPlatformLabel("https://github.com/acme/tool/releases/tag/v1"),
    "GitHub Releases",
  );
  assert.equal(
    inferKnownPlatformLabel("https://github.com.evil.example/acme"),
    null,
  );
  assert.equal(
    inferKnownPlatformLabel("https://evil.example/?next=steampowered.com"),
    null,
  );
  assert.equal(
    inferKnownPlatformLabel("https://evil.example/path/youtube.com/watch"),
    null,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://github.com.evil.example/acme",
      formalKind: "other",
      usageMethod: "other",
    }),
    GENERIC_EXTERNAL_PAGE,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://example.com/x",
      formalKind: "unity_play",
    }),
    "Unity Play",
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://example.com/x",
      formalKind: "itch",
    }),
    "itch.io",
  );
}

// --- 2. generic fallback from usage / distribution; never verb CTA ---
{
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://bpnisgzxuwdxelhnduuf.supabase.co/storage/v1/object/public/builds/a.zip",
      formalKind: "other",
      usageMethod: "download",
    }),
    GENERIC_DIRECT_DOWNLOAD,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://unknown.example/play",
      formalKind: "other",
      usageMethod: "browser",
    }),
    GENERIC_BROWSER,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://unknown.example/store",
      formalKind: "other",
      usageMethod: "store",
    }),
    GENERIC_EXTERNAL_STORE,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://unknown.example/file.zip",
      formalKind: "other",
      usageMethod: "other",
      distributionType: "download",
    }),
    GENERIC_EXTERNAL_PAGE,
  );
  const downloadGame = baseGame({
    playUrl: "https://unknown.example/file.zip",
    tags: [DIST_DOWNLOAD_TAG],
    publishDestinations: [
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "download",
        url: "https://unknown.example/file.zip",
        isPrimary: true,
      }),
    ],
  });
  assert.equal(
    resolvePlayDestinations(downloadGame)[0]?.infoLabel,
    GENERIC_DIRECT_DOWNLOAD,
  );
  assert.notEqual(
    resolvePlayDestinations(downloadGame)[0]?.infoLabel,
    "ダウンロードする",
  );
}

// --- 3. technical hostname never used as public name ---
{
  const storage =
    "https://bpnisgzxuwdxelhnduuf.supabase.co/storage/v1/object/public/builds/a.zip";
  assert.equal(isTechnicalDistributionHost(storage), true);
  assert.equal(isTechnicalDistributionHost("https://storage.googleapis.com/bucket/a"), true);
  assert.equal(isTechnicalDistributionHost("https://cdn.example.com/file"), true);
  assert.equal(inferKnownPlatformLabel(storage), null);
  const label = resolveOverviewDistributionLabel({
    url: storage,
    formalKind: "other",
    usageMethod: "download",
  });
  assert.equal(label, GENERIC_DIRECT_DOWNLOAD);
  assert.ok(label && !label.includes("supabase.co"));
  assert.ok(label && !label.includes("storage.googleapis.com"));
  const storageUnknown = resolveOverviewDistributionLabel({
    url: storage,
    formalKind: "other",
    usageMethod: "other",
  });
  assert.equal(storageUnknown, GENERIC_EXTERNAL_PAGE);
  assert.ok(!storageUnknown.includes("supabase"));
}

// --- 4. prototype kind (YouTube etc.) survives formal `other` ---
{
  const audio = baseGame({
    category: "audio",
    tags: [DIST_EXTERNAL_TAG],
    playUrl: "https://www.youtube.com/watch?v=abc",
    publishDestinations: [
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "other",
        url: "https://www.youtube.com/watch?v=abc",
        isPrimary: true,
      }),
    ],
    categoryAttributes: {
      nonGamePublishDestinations: [
        {
          id: "p1",
          kind: "YouTube",
          url: "https://www.youtube.com/watch?v=abc",
          isPrimary: true,
        },
      ],
    },
  });
  assert.equal(resolveOverviewDistributionLabelForGame(audio, {
    url: "https://www.youtube.com/watch?v=abc",
    formalKind: "other",
    usageMethod: "other",
  }), "YouTube");
}

// --- 5. related link 「その他」 hidden ---
{
  const other = toRelatedLinkDisplays([
    createEmptyRelatedLink({
      kind: "other",
      url: "https://mysterious.example/page",
      label: null,
    }),
  ])[0];
  assert.equal(other.kindLabel, "その他");
  assert.equal(overviewRelatedLinkIdentity(other), RELATED_LINK_UNLABELED);

  const labeled = toRelatedLinkDisplays([
    createEmptyRelatedLink({
      kind: "other",
      url: "https://mysterious.example/page",
      label: "制作メモ",
    }),
  ])[0];
  assert.equal(overviewRelatedLinkIdentity(labeled), "制作メモ");

  const xLink = toRelatedLinkDisplays([
    createEmptyRelatedLink({
      kind: "other",
      url: "https://x.com/forge",
      label: null,
    }),
  ])[0];
  assert.equal(overviewRelatedLinkIdentity(xLink), "X");

  const official = toRelatedLinkDisplays([
    createEmptyRelatedLink({
      kind: "official_site",
      url: "https://example.com",
      label: null,
    }),
  ])[0];
  assert.equal(overviewRelatedLinkIdentity(official), "公式サイト");
}

// --- 6. source: Overview hides 遊び方, uses 公開・配布, 3+2 chips, no purple CTA ---
{
  const overview = read("components/game-detail-player-overview.tsx");
  assert.match(overview, /OVERVIEW_PUBLICATION_TITLE/);
  assert.match(overview, /data-play-time-chips="3-2"/);
  assert.match(overview, /playTimeOptions\.slice\(0, 3\)/);
  assert.match(overview, /playTimeOptions\.slice\(3\)/);
  assert.match(overview, /whitespace-nowrap/);
  assert.match(overview, /data-overview-grid="rows"/);
  assert.match(overview, /lg:items-stretch/);
  assert.doesNotMatch(overview, /遊び方/);
  assert.doesNotMatch(overview, /bg-violet-500\/15/);
  assert.doesNotMatch(overview, /primaryCtaLabel \?\? primary\.actionLabel/);
  assert.equal(OVERVIEW_PUBLICATION_TITLE, "公開・配布");
  assert.equal(GENERIC_EXTERNAL_PAGE, "外部ページ");
  assert.deepEqual([...PLAY_TIME_OPTIONS], [
    "5分未満",
    "5〜15分",
    "15〜30分",
    "30分〜1時間",
    "1時間以上",
  ]);
}

// --- 7. rendered game Overview ---
{
  const game = baseGame({
    publishDestinations: [
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "download",
        url: "https://unknown.example/file.zip",
        isPrimary: true,
      }),
    ],
    relatedLinks: [
      createEmptyRelatedLink({
        kind: "other",
        url: "https://x.com/demo",
        label: null,
      }),
    ],
  });
  const destinations = resolvePlayDestinations(game);
  const html = renderToStaticMarkup(
    React.createElement(GameDetailPlayerOverview, {
      game: detailGame,
      heroLead: detailGame.lead,
      playerMeta: playerMetaFor(game),
      activity,
      publication: { labels: destinations.map((item) => item.infoLabel ?? "") },
      playDestinations: destinations,
      relatedLinks: toRelatedLinkDisplays(game.relatedLinks ?? []),
    }),
  );
  assert.match(html, /公開・配布/);
  assert.match(html, /直接ダウンロード/);
  assert.match(html, /プレイ情報/);
  assert.match(html, /想定時間/);
  assert.match(html, /data-play-time-chips="3-2"/);
  assert.match(html, /作品紹介/);
  assert.match(html, /最近の動き/);
  assert.doesNotMatch(html, /遊び方/);
  assert.doesNotMatch(html, /ダウンロードする/);
  assert.doesNotMatch(html, />その他</);
  assert.match(html, /data-overview-related-identity="X"/);
  assert.doesNotMatch(html, /bg-violet-500/);
}

// --- 8. 5-category chrome: no game-only concepts on non-game info cards ---
{
  const forbidden = /プレイ時間|プレイヤー数|遊び方/;
  for (const category of ["audio", "asset", "dev-tool", "service-app"] as const) {
    const chrome = resolveProjectDetailCategoryChrome({
      category,
      game: baseGame({
        category,
        categoryAttributes:
          category === "asset"
            ? { kinds: ["3Dモデル"], formats: ["FBX"] }
            : category === "audio"
              ? { kinds: ["BGM"], musicDuration: "1:00" }
              : category === "dev-tool"
                ? { kinds: ["エディタ拡張"], toolEnvironments: ["Windows"] }
                : { kinds: ["Webサービス"], purposes: ["開発補助"] },
        assetKinds: category === "asset" ? ["3Dモデル"] : [],
      }),
    });
    assert.equal(chrome.showGamePlayInfo, false);
    assert.ok(chrome.infoCard);
    assert.doesNotMatch(chrome.infoCard.title, forbidden);
    for (const row of chrome.infoCard.rows) {
      assert.doesNotMatch(row.label, forbidden);
      assert.doesNotMatch(row.value, forbidden);
    }
    const html = renderToStaticMarkup(
      React.createElement(GameDetailPlayerOverview, {
        game: detailGame,
        heroLead: detailGame.lead,
        playerMeta: playerMetaFor(baseGame({ category, phase: "playable" })),
        activity,
        publication: { labels: [GENERIC_BROWSER] },
        playDestinations: [
          {
            label: "other",
            url: "https://example.com/app",
            actionLabel: "利用する",
            infoLabel: GENERIC_BROWSER,
          },
        ],
        prototypeInfoCard: chrome.infoCard,
        primaryCtaLabel: chrome.primaryCtaLabel,
      }),
    );
    assert.match(html, /公開・配布/);
    assert.match(html, new RegExp(chrome.infoCard.title));
    assert.doesNotMatch(html, /プレイ情報/);
    assert.doesNotMatch(html, /遊び方/);
    assert.doesNotMatch(html, />利用する</);
    assert.doesNotMatch(html, />入手する</);
    assert.doesNotMatch(html, /bg-violet-500/);
  }

  const gameChrome = resolveProjectDetailCategoryChrome({
    category: "game",
    game: baseGame(),
  });
  assert.equal(gameChrome.showGamePlayInfo, true);
  assert.equal(gameChrome.infoCard, undefined);
}

// --- 9. Owner decision A: other + unknown URL → 外部ページ ---
{
  const unresolved = resolveOverviewDistributionLabel({
    url: "https://mystery.example/path",
    formalKind: "other",
    usageMethod: "other",
  });
  assert.equal(unresolved, GENERIC_EXTERNAL_PAGE);
  assert.notEqual(unresolved, "その他");
  assert.notEqual(unresolved, "mystery.example");
  assert.ok(!unresolved.includes("supabase.co"));
}

// --- 10. saved prototype kind / 自サイト are not overwritten by formal mapping ---
{
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://github.com/acme/tool",
      formalKind: "github_releases",
      prototypeKindLabel: "GitHubリポジトリ",
    }),
    "GitHubリポジトリ",
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://mystery.example/page",
      formalKind: "self_site",
      usageMethod: "other",
      prototypeKindLabel: "自サイト",
    }),
    "自サイト",
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://mystery.example/page",
      formalKind: "other",
      usageMethod: "other",
      distributionType: "",
    }),
    GENERIC_EXTERNAL_PAGE,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://mystery.example/ext",
      prototypeKindLabel: "拡張機能ストア",
    }),
    GENERIC_EXTERNAL_STORE,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://mystery.example/ext",
      prototypeKindLabel: "ブラウザ拡張機能ストア",
    }),
    GENERIC_EXTERNAL_STORE,
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://discord.com/invite/abc",
      prototypeKindLabel: "Discord等の追加・招待先",
    }),
    "Discord",
  );
  assert.equal(
    resolveOverviewDistributionLabel({
      url: "https://mystery.example/invite",
      prototypeKindLabel: "Discord等の追加・招待先",
    }),
    GENERIC_EXTERNAL_PAGE,
  );
}

// --- 11. other + unknown URL renders 外部ページ, never icon-only / その他 ---
{
  const html = renderToStaticMarkup(
    React.createElement(GameDetailPlayerOverview, {
      game: detailGame,
      heroLead: detailGame.lead,
      playerMeta: playerMetaFor(baseGame()),
      activity,
      publication: { labels: [] },
      playDestinations: [
        {
          label: "その他",
          url: "https://mystery.example/path",
          actionLabel: "ダウンロードする",
          infoLabel: GENERIC_EXTERNAL_PAGE,
        },
      ],
    }),
  );
  assert.match(html, /公開・配布/);
  assert.match(html, /href="https:\/\/mystery\.example\/path"/);
  assert.match(html, /外部ページ/);
  assert.match(html, /data-overview-distribution="info"/);
  assert.doesNotMatch(html, />その他</);
  assert.doesNotMatch(html, /ダウンロードする/);

  const storeHtml = renderToStaticMarkup(
    React.createElement(GameDetailPlayerOverview, {
      game: detailGame,
      heroLead: detailGame.lead,
      playerMeta: playerMetaFor(baseGame({ category: "service-app" })),
      activity,
      publication: { labels: [GENERIC_EXTERNAL_STORE] },
      playDestinations: [
        {
          label: "拡張機能ストア",
          url: "https://mystery.example/ext",
          actionLabel: "利用する",
          infoLabel: GENERIC_EXTERNAL_STORE,
        },
      ],
      prototypeInfoCard: { title: "サービス情報", rows: [] },
    }),
  );
  assert.match(storeHtml, /外部ストア/);
  assert.doesNotMatch(storeHtml, /拡張機能ストア/);
}

// --- 12. usage other + DIST_EXTERNAL_TAG must not become 外部ストア ---
{
  const taggedOther = baseGame({
    tags: [ENV_PC_TAG, DIST_EXTERNAL_TAG],
    playUrl: "https://mystery.example/other",
    publishDestinations: [
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "other",
        url: "https://mystery.example/other",
        isPrimary: true,
      }),
    ],
  });
  assert.equal(
    resolvePlayDestinations(taggedOther)[0]?.infoLabel,
    GENERIC_EXTERNAL_PAGE,
  );

  const protoOther = baseGame({
    category: "service-app",
    tags: [DIST_EXTERNAL_TAG],
    playUrl: "https://mystery.example/svc",
    publishDestinations: [
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "other",
        url: "https://mystery.example/svc",
        isPrimary: true,
      }),
    ],
    categoryAttributes: {
      nonGamePublishDestinations: [
        {
          id: "p-other",
          kind: "その他",
          url: "https://mystery.example/svc",
          isPrimary: true,
        },
      ],
    },
  });
  assert.equal(
    resolvePlayDestinations(protoOther)[0]?.infoLabel,
    GENERIC_EXTERNAL_PAGE,
  );
  const protoHtml = renderToStaticMarkup(
    React.createElement(GameDetailPlayerOverview, {
      game: detailGame,
      heroLead: detailGame.lead,
      playerMeta: playerMetaFor(protoOther),
      activity,
      publication: { labels: [GENERIC_EXTERNAL_PAGE] },
      playDestinations: resolvePlayDestinations(protoOther),
      prototypeInfoCard: { title: "サービス情報", rows: [] },
    }),
  );
  assert.match(protoHtml, /外部ページ/);
  assert.doesNotMatch(protoHtml, /外部ストア/);
  assert.doesNotMatch(protoHtml, />その他</);
  assert.doesNotMatch(protoHtml, />mystery\.example</);

  const explicitStore = baseGame({
    tags: [DIST_EXTERNAL_TAG],
    playUrl: "https://mystery.example/store",
    publishDestinations: [
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "store",
        url: "https://mystery.example/store",
        isPrimary: true,
      }),
    ],
  });
  assert.equal(
    resolvePlayDestinations(explicitStore)[0]?.infoLabel,
    GENERIC_EXTERNAL_STORE,
  );
}

console.log("verify-overview-distribution-display: PASS");
