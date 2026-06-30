/**
 * Pure-logic checks for submit fallback, thumbnails, reorder, login helpers.
 * No Supabase / browser required.
 *
 * Usage: npm run verify:submit-auth-utils
 */
import type { PostgrestError } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import { mapProjectSubmitErrorMessage } from "../lib/error-message";
import { sanitizeLoginReturnUrl } from "../lib/login-return-url";
import { projectThumbnailsForDb, sanitizeProjectThumbnailUrls } from "../lib/project-thumbnails";
import { reorderArrayItem } from "../lib/reorder-array-item";
import {
  getMissingProjectColumn,
  omitProjectColumn,
  writeProjectRowWithSchemaFallback,
} from "../lib/supabase/project-write-compat";
import {
  buildGameDetailTabHref,
  parseGameDetailTab,
} from "../lib/game-detail-tabs";
import {
  gameHistoryHref,
  gameVersionBannerHref,
  notificationTargetHref,
} from "../lib/project-nurture-links";
import {
  isValidDevlogEntry,
  normalizeGameDevlogEntry,
  realDevlogToV0,
} from "../hooks/use-game-devlogs-v0";
import type { DevlogEntry } from "../lib/devlogs";
import { getDevlogStatsForGame } from "../lib/game-devlog-v0-mock-data";
import { isSupabaseProjectId } from "../lib/submitted-game-v0-adapter";

function ok(condition: boolean, message: string) {
  assert.equal(condition, true, message);
}

function testReorderArrayItem() {
  ok(
    JSON.stringify(reorderArrayItem(["a", "b", "c"], 1, 0)) ===
      JSON.stringify(["b", "a", "c"]),
    "reorder: move index 1 before 0",
  );
  ok(
    JSON.stringify(reorderArrayItem(["a", "b", "c"], 0, 0)) ===
      JSON.stringify(["a", "b", "c"]),
    "reorder: same index is no-op",
  );
  ok(
    JSON.stringify(reorderArrayItem(["a"], 0, 0)) === JSON.stringify(["a"]),
    "reorder: single item",
  );
}

function testThumbnailSanitize() {
  const dupes = sanitizeProjectThumbnailUrls([" https://x/a ", "https://x/a", ""]);
  ok(dupes.length === 1 && dupes[0] === "https://x/a", "thumbnail: trim and dedupe");

  const db = projectThumbnailsForDb(["https://first", "https://second"]);
  ok(db.thumbnail_url === "https://first", "thumbnail: first is primary");
  ok(
    JSON.stringify(db.thumbnail_urls) === JSON.stringify(["https://first", "https://second"]),
    "thumbnail: array preserved",
  );
}

function testSchemaFallbackDetection() {
  const err = { message: 'column "thumbnail_urls" of relation "projects" does not exist' };
  ok(getMissingProjectColumn(err) === "thumbnail_urls", "detect missing thumbnail_urls");

  const cacheErr = {
    message: "Could not find the 'genres' column of 'projects' in the schema cache",
  };
  ok(getMissingProjectColumn(cacheErr) === "genres", "detect schema cache genres");

  ok(getMissingProjectColumn({ message: "permission denied" }) === null, "ignore non-schema errors");

  const row = { title: "t", thumbnail_urls: ["a"], genres: ["RPG"] };
  const stripped = omitProjectColumn(row, "thumbnail_urls");
  ok(!("thumbnail_urls" in stripped) && stripped.title === "t", "omit column");
}

function mockPostgrestError(message: string, code = "42703"): PostgrestError {
  return { message, code, details: "", hint: "", name: "PostgrestError" } as PostgrestError;
}

async function testSchemaFallbackWrite() {
  const attempts: Record<string, unknown>[] = [];

  const result = await writeProjectRowWithSchemaFallback(async (payload) => {
    attempts.push({ ...payload });
    if ("thumbnail_urls" in payload) {
      return {
        data: null,
        error: mockPostgrestError('column "thumbnail_urls" does not exist'),
      };
    }
    return { data: { id: "game-1", title: payload.title }, error: null };
  }, { title: "Test", thumbnail_urls: ["a"], genre: "RPG" });

  ok(result.id === "game-1", "fallback write succeeds after strip");
  ok(attempts.length === 2, "fallback retries once");
  ok(!("thumbnail_urls" in attempts[1]!), "second attempt drops thumbnail_urls");
}

async function testSchemaFallbackDoesNotMaskOtherErrors() {
  let threw = false;
  try {
    await writeProjectRowWithSchemaFallback(async () => {
      return {
        data: null,
        error: mockPostgrestError("duplicate key value violates unique constraint", "23505"),
      };
    }, { title: "Dup" });
  } catch (error) {
    threw = true;
    ok(
      resolveErrorMessage(error).includes("duplicate key"),
      "non-schema errors propagate",
    );
  }
  ok(threw, "non-schema errors throw");
}

function resolveErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

function testSubmitErrorMapping() {
  const migration = mapProjectSubmitErrorMessage({
    message: 'column "thumbnail_urls" does not exist',
  });
  ok(migration.includes("migration"), "migration hint for missing column");

  const rls = mapProjectSubmitErrorMessage({ message: "row-level security", code: "42501" });
  ok(rls.includes("ログイン"), "RLS maps to login hint");

  const plain = mapProjectSubmitErrorMessage({ message: "custom failure" });
  ok(plain === "custom failure", "passthrough unknown messages");
}

function testLoginReturnSanitize() {
  ok(sanitizeLoginReturnUrl("/games/abc") === "/games/abc", "allow game detail return");
  ok(
    sanitizeLoginReturnUrl("/games/abc?tab=devlog") === "/games/abc?tab=devlog",
    "allow game detail devlog tab",
  );
  ok(sanitizeLoginReturnUrl("//evil.com") === null, "reject protocol-relative");
  ok(sanitizeLoginReturnUrl("https://evil.com") === null, "reject absolute url");
  ok(sanitizeLoginReturnUrl("%2F%2Fevil.com") === null, "reject encoded protocol-relative");
  ok(sanitizeLoginReturnUrl("/\\evil.com") === null, "reject backslash path");
  ok(
    sanitizeLoginReturnUrl("/games/abc?tab=devlog&next=https://evil.com") === null,
    "reject extra game query param",
  );
  ok(sanitizeLoginReturnUrl("/studio?unknown=1") === null, "reject unknown studio query");
  ok(
    sanitizeLoginReturnUrl("/projects/abc/studio#feedback") === "/projects/abc/studio",
    "strip hash from project studio return",
  );
  ok(sanitizeLoginReturnUrl("/games/abc?tab=versions") === null, "reject non-existent versions tab in return");
  ok(sanitizeLoginReturnUrl("/studio/mypage") === "/studio/mypage", "allow studio mypage");
  ok(
    sanitizeLoginReturnUrl("/studio/mypage?submit=1") === "/studio/mypage?submit=1",
    "allow studio submit modal return",
  );
  ok(sanitizeLoginReturnUrl("/submit") === "/submit", "allow submit path");
  ok(sanitizeLoginReturnUrl("/my-projects") === "/my-projects", "allow my-projects path");
  ok(
    sanitizeLoginReturnUrl("/projects/proj-1/studio?devlog=1") ===
      "/projects/proj-1/studio?devlog=1",
    "allow project studio devlog modal",
  );
  ok(
    sanitizeLoginReturnUrl("/games/abc?next=//evil.com") === null,
    "reject unknown game query params",
  );
  ok(
    sanitizeLoginReturnUrl("/studio/mypage?return=//evil.com") === null,
    "reject unknown studio query params",
  );
  ok(
    sanitizeLoginReturnUrl("/games/abc/../../../studio") === null,
    "reject path traversal",
  );
}

function testNotificationNurtureLinks() {
  ok(
    gameHistoryHref("proj-1") === "/games/proj-1?tab=devlog",
    "game history href uses devlog tab",
  );
  ok(
    gameVersionBannerHref("proj-1") === "/games/proj-1?tab=devlog",
    "version banner href uses devlog tab",
  );
  ok(
    notificationTargetHref({
      id: "n1",
      type: "devlog",
      projectId: "proj-1",
      projectTitle: "Test Game",
      message: "update",
      date: "2026-01-01",
      read: false,
    }) === "/games/proj-1?tab=devlog",
    "notification devlog target uses devlog tab",
  );
  ok(
    notificationTargetHref({
      id: "n2",
      type: "version_published",
      projectId: "proj-1",
      projectTitle: "Test Game",
      message: "new ver",
      date: "2026-01-01",
      read: false,
    }) === "/games/proj-1?tab=devlog",
    "notification version_published uses devlog tab",
  );
}

function testDemoRouteBlocksProduction() {
  const prevProd = process.env.NEXT_PUBLIC_FORGE_PRODUCTION_MODE;
  const { blockDemoRouteOnProduction } =
    require("../lib/demo/demo-route-guard") as typeof import("../lib/demo/demo-route-guard");

  function expectNotFound(host: string, label: string) {
    let threw = false;
    try {
      blockDemoRouteOnProduction(host);
    } catch {
      threw = true;
    }
    ok(threw, label);
  }

  function expectAllowed(host: string, label: string) {
    let threw = false;
    try {
      blockDemoRouteOnProduction(host);
    } catch {
      threw = true;
    }
    ok(!threw, label);
  }

  try {
    process.env.NEXT_PUBLIC_FORGE_PRODUCTION_MODE = "true";
    process.env.VERCEL_ENV = "production";
    expectNotFound("forge-flame-gamma.vercel.app", "demo routes 404 on production hostname");
    delete process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "preview";
    expectAllowed(
      "forge-9flhmt30r-soshirow-alts-projects.vercel.app",
      "demo routes allowed on Vercel preview deployment URL",
    );
    delete process.env.VERCEL_ENV;
    expectAllowed(
      "forge-git-preview-landing-01-soshirow-alts-projects.vercel.app",
      "demo routes allowed on preview branch alias",
    );
    expectAllowed("localhost:3001", "demo routes allowed on localhost");
  } finally {
    if (prevProd === undefined) {
      delete process.env.NEXT_PUBLIC_FORGE_PRODUCTION_MODE;
    } else {
      process.env.NEXT_PUBLIC_FORGE_PRODUCTION_MODE = prevProd;
    }
    delete process.env.VERCEL_ENV;
  }
}

function testStudioMypageOwnedProjectsResolver() {
  const { resolveStudioMypageOwnedProjects } =
    require("../lib/studio-mypage-owned-projects") as typeof import("../lib/studio-mypage-owned-projects");
  const real = [{ id: "real-1", ownerId: "user-a" } as import("../lib/mock-games").Game];

  ok(
    resolveStudioMypageOwnedProjects(real, true).length === 1,
    "production mode returns real owned only",
  );
  ok(
    resolveStudioMypageOwnedProjects([], true).length === 0,
    "production mode returns empty without mock fallback",
  );
  const previewEmpty = resolveStudioMypageOwnedProjects([], false);
  ok(previewEmpty.length > 0, "preview mode injects mock games when real list empty");
  ok(
    resolveStudioMypageOwnedProjects(real, false).length === 1,
    "preview mode prefers real owned over mock",
  );
}

function testMainFlowsNoAdScreenshotDemo() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const root = path.join(import.meta.dirname, "..");
  const files = [
    "components/games-provider.tsx",
    "components/studio-home-page.tsx",
    "components/studio-owned-projects-section.tsx",
    "components/mypage-page.tsx",
    "lib/studio-mypage-owned-projects.ts",
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    ok(
      !source.includes("ad-screenshot-demo") &&
        !source.includes("isAdScreenshotDemoEnabled") &&
        !source.includes("adScreenshotStudioProjects"),
      `${file} has no ad screenshot demo imports`,
    );
  }
  ok(
    !fs.existsSync(path.join(root, "lib/ad-screenshot-demo.ts")),
    "legacy lib/ad-screenshot-demo.ts removed from main lib",
  );
}

function testStudioMypagePageSingleDirectoryPanel() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const mypage = fs.readFileSync(
    path.join(import.meta.dirname, "../components/studio-mypage-page.tsx"),
    "utf8",
  );
  const provider = fs.readFileSync(
    path.join(import.meta.dirname, "../components/games-provider.tsx"),
    "utf8",
  );
  ok(
    !mypage.includes("StudioProjectsTabPanel"),
    "studio-mypage-page does not swap to StudioProjectsTabPanel",
  );
  ok(
    !mypage.includes("isAdScreenshotDemoEnabled"),
    "studio-mypage-page projects tab has no ad demo branch",
  );
  ok(
    mypage.includes("StudioOwnedProjectsDirectoryPanel"),
    "studio-mypage-page always uses DirectoryPanel for projects",
  );
  ok(
    provider.includes("getStudioMypageOwnedProjects"),
    "games-provider exposes getStudioMypageOwnedProjects",
  );
}

function testGamesProviderMockGuardContract() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const source = fs.readFileSync(
    path.join(import.meta.dirname, "../components/games-provider.tsx"),
    "utf8",
  );

  ok(
    source.includes("if (shouldHideV0MockContent())") &&
      source.includes("const mock = getMockGameById(id);"),
    "getGameById skips mock fallback in production mode",
  );
  ok(
    source.includes("setLocalNotifications(loadLocalNotifications());") &&
      source.includes("if (!shouldHideV0MockContent())"),
    "local mock notifications load only outside production mode",
  );
}

function testPublicCatalogAuthIndependenceContract() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const provider = fs.readFileSync(
    path.join(import.meta.dirname, "../components/games-provider.tsx"),
    "utf8",
  );
  const projects = fs.readFileSync(
    path.join(import.meta.dirname, "../lib/supabase/projects.ts"),
    "utf8",
  );

  ok(provider.includes("publicGames"), "games-provider exposes publicGames");
  ok(provider.includes("publicCatalogReady"), "games-provider exposes publicCatalogReady");
  ok(provider.includes("fetchPublicProjects"), "games-provider imports fetchPublicProjects");
  ok(
    provider.includes("void reloadPublicCatalog()") &&
      provider.includes(".finally(() => setPublicCatalogReady(true))"),
    "public catalog loads on mount and sets publicCatalogReady",
  );
  const mountEffectStart = provider.indexOf("setHydrated(true);");
  const publicFetchIndex = provider.indexOf("void reloadPublicCatalog()");
  const authCatalogEffect = provider.indexOf("if (!authHydrated) {\n      return;\n    }\n\n    if (!user) {\n      catalogUserIdRef");
  ok(
    mountEffectStart > -1 &&
      publicFetchIndex > mountEffectStart &&
      (authCatalogEffect < 0 || publicFetchIndex < authCatalogEffect),
    "reloadPublicCatalog is not gated behind authHydrated catalog effect",
  );
  ok(
    projects.includes('.eq("visibility", "public")'),
    "fetchPublicProjects filters visibility public explicitly",
  );
}

function testHomeSearchPublicCatalogContract() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const home = fs.readFileSync(
    path.join(import.meta.dirname, "../components/discovery-home-page.tsx"),
    "utf8",
  );
  const search = fs.readFileSync(
    path.join(import.meta.dirname, "../components/works-search-page.tsx"),
    "utf8",
  );

  ok(home.includes("publicCatalogReady"), "discovery-home gates on publicCatalogReady");
  ok(home.includes("publicGames"), "discovery-home reads publicGames");
  ok(!home.includes("dataReady"), "discovery-home does not use dataReady");
  ok(!home.includes("submittedGames"), "discovery-home does not use submittedGames");

  ok(search.includes("publicCatalogReady"), "works-search gates on publicCatalogReady");
  ok(search.includes("publicGames"), "works-search reads publicGames");
  ok(!search.includes("dataReady"), "works-search does not use dataReady");
  ok(!search.includes("submittedGames"), "works-search does not use submittedGames");
}

function testAuthRedirectLoopGuardContract() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const authProvider = fs.readFileSync(
    path.join(import.meta.dirname, "../components/auth-provider.tsx"),
    "utf8",
  );
  const studioGuard = fs.readFileSync(
    path.join(import.meta.dirname, "../components/studio-entry-gate-provider.tsx"),
    "utf8",
  );
  const loginRoute = fs.readFileSync(
    path.join(import.meta.dirname, "../app/login/page.tsx"),
    "utf8",
  );
  const loginPage = fs.readFileSync(
    path.join(import.meta.dirname, "../components/login-page.tsx"),
    "utf8",
  );

  ok(
    !loginRoute.includes("redirect(resolvePostLoginPath") &&
      !loginRoute.includes("getUser()"),
    "login server route does not redirect on getUser (avoids studio ping-pong)",
  );
  ok(
    loginPage.includes("authResolved") && loginPage.includes("router.replace"),
    "login page redirects only after client authResolved",
  );

  ok(authProvider.includes("authResolved"), "auth-provider exposes authResolved");
  ok(
    authProvider.includes("supabase.auth.getUser()"),
    "auth-provider hydrates with client getUser",
  );
  ok(
    !authProvider.includes("supabase.auth.getSession()"),
    "auth-provider does not hydrate with getSession",
  );
  ok(
    authProvider.includes('event === "SIGNED_OUT"') &&
      authProvider.includes("hadServerUserRef"),
    "auth-provider keeps server initialUser until sign-out or client confirmation",
  );
  ok(
    studioGuard.includes("authResolved") &&
      studioGuard.includes("if (!authResolved)"),
    "StudioDirectAccessGuard waits for authResolved before login redirect",
  );
}

function testLoginPageSourceContract() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const loginPage = fs.readFileSync(
    path.join(import.meta.dirname, "../components/login-page.tsx"),
    "utf8",
  );
  const loginRoute = fs.readFileSync(
    path.join(import.meta.dirname, "../app/login/page.tsx"),
    "utf8",
  );

  ok(loginPage.includes("useActionState(loginAction"), "login uses server action");
  ok(loginPage.includes('autoComplete="username email"'), "login email autocomplete");
  ok(loginPage.includes("useAuthAutofillUnlock"), "login autofill unlock hook");
  ok(loginPage.includes("readOnly={autofill.readOnly}"), "login readOnly autofill trick");
  ok(loginPage.includes('type="password"'), "login native password input");
  ok(!loginPage.includes("useSearchParams"), "login avoids searchParams remount");
  ok(
    !loginRoute.includes("getUser()"),
    "login route does not server-redirect logged-in users",
  );
  ok(
    loginPage.includes("resolvePostLoginPath"),
    "login page client redirect uses post-login path",
  );
}

function testRealDevlogMapping() {
  const minimal: DevlogEntry = {
    id: "d-1",
    projectId: "00000000-0000-0000-0000-000000000001",
    title: "",
    content: "",
    date: "2026-06-01",
  };
  ok(isValidDevlogEntry(minimal), "valid devlog entry");
  const mapped = realDevlogToV0(minimal, true);
  ok(mapped.title === "（無題）", "devlog null-safe title");
  ok(mapped.excerpt === "—", "devlog null-safe content");
  ok(mapped.highlights.length === 0, "devlog note has no highlights");
  ok(mapped.relativeLabel === mapped.publishedAt, "devlog stable relative label");

  const versioned: DevlogEntry = {
    ...minimal,
    id: "d-2",
    title: "ver公開",
    content: "本文",
    publishedVersion: "v0.2.0",
  };
  const versionMapped = realDevlogToV0(versioned, false);
  ok(versionMapped.kind === "version", "devlog version kind");
  ok(versionMapped.highlights.length === 1, "devlog version highlight");

  const extra = normalizeGameDevlogEntry({
    id: "x",
    version: "—",
    publishedAt: "—",
    relativeLabel: "—",
    title: "t",
    excerpt: "e",
    highlights: undefined as unknown as string[],
    kind: "note",
  });
  ok(Array.isArray(extra.highlights) && extra.highlights.length === 0, "normalize highlights");

  const uuid = "00000000-0000-0000-0000-000000000099";
  ok(isSupabaseProjectId(uuid), "uuid detector for real project");
  ok(!isSupabaseProjectId("seikat-no-tabiji"), "slug is not supabase id");
}

function testDevlogStatsForGame() {
  const empty = getDevlogStatsForGame([]);
  ok(empty.totalPosts === 0, "devlog stats: empty array totalPosts 0");
  ok(empty.currentVersion === "—", "devlog stats: empty array currentVersion fallback");
  ok(empty.lastUpdated === "—", "devlog stats: empty array lastUpdated fallback");

  const dashVersion = getDevlogStatsForGame([
    {
      id: "e-1",
      version: "—",
      publishedAt: "2026/6/1",
      relativeLabel: "2026/6/1",
      title: "メモ",
      excerpt: "—",
      highlights: [],
      kind: "note",
      isLatest: true,
    },
  ]);
  ok(dashVersion.currentVersion === "—", "devlog stats: dash version entry no throw");
  ok(dashVersion.lastUpdated === "2026/6/1", "devlog stats: preserves publishedAt");

  const withVersion = getDevlogStatsForGame([
    {
      id: "e-2",
      version: "v0.2.0",
      publishedAt: "2026/6/2",
      relativeLabel: "2026/6/2",
      title: "ver公開",
      excerpt: "本文",
      highlights: ["プレイ可能verが更新されました"],
      kind: "version",
      isLatest: true,
    },
  ]);
  ok(withVersion.currentVersion === "v0.2.0", "devlog stats: uses latest version when set");
}

function testGameDetailTabs() {
  ok(parseGameDetailTab(null) === "overview", "game detail tab: default overview");
  ok(parseGameDetailTab("devlog") === "devlog", "game detail tab: devlog");
  ok(parseGameDetailTab("versions") === "devlog", "game detail tab: versions alias");

  const withExtra = new URLSearchParams("returning=1&changeCheck=seen");
  ok(
    buildGameDetailTabHref("abc-123", "devlog", withExtra) ===
      "/games/abc-123?returning=1&changeCheck=seen&tab=devlog",
    "game detail tab: preserve query on devlog",
  );
  ok(
    buildGameDetailTabHref("abc-123", "overview", new URLSearchParams("tab=devlog")) ===
      "/games/abc-123",
    "game detail tab: strip tab for overview",
  );
}

async function main() {
  const tests: Array<[string, () => void | Promise<void>]> = [
    ["reorderArrayItem", testReorderArrayItem],
    ["thumbnail sanitize", testThumbnailSanitize],
    ["schema fallback detection", testSchemaFallbackDetection],
    ["schema fallback write", testSchemaFallbackWrite],
    ["schema fallback error masking", testSchemaFallbackDoesNotMaskOtherErrors],
    ["submit error mapping", testSubmitErrorMapping],
    ["login return sanitize", testLoginReturnSanitize],
    ["notification nurture links", testNotificationNurtureLinks],
    ["demo route blocks production", testDemoRouteBlocksProduction],
    ["studio mypage owned projects resolver", testStudioMypageOwnedProjectsResolver],
    ["main flows no ad screenshot demo", testMainFlowsNoAdScreenshotDemo],
    ["studio mypage single directory panel", testStudioMypagePageSingleDirectoryPanel],
    ["games provider mock guard contract", testGamesProviderMockGuardContract],
    ["public catalog auth independence contract", testPublicCatalogAuthIndependenceContract],
    ["home search public catalog contract", testHomeSearchPublicCatalogContract],
    ["auth redirect loop guard contract", testAuthRedirectLoopGuardContract],
    ["login page source contract", testLoginPageSourceContract],
    ["game detail tabs", testGameDetailTabs],
    ["real devlog mapping", testRealDevlogMapping],
    ["devlog stats for game", testDevlogStatsForGame],
  ];

  let passed = 0;
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  }

  console.log(`\nverify:submit-auth-utils — ${passed}/${passed} passed`);
}

main().catch((error) => {
  console.error("\nverify:submit-auth-utils FAILED\n", error);
  process.exit(1);
});
