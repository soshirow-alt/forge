/**
 * Pure-logic checks for submit fallback, thumbnails, reorder, login helpers.
 * No Supabase / browser required.
 *
 * Usage: npm run verify:submit-auth-utils
 */
import type { PostgrestError } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import {
  buildOAuthCallbackRedirectUrl,
  resolveOAuthCallbackDestination,
  resolveOAuthCallbackErrorPath,
} from "../lib/auth-redirect";
import {
  normalizeOAuthFailureReason,
} from "../lib/oauth-callback-errors";
import {
  OAUTH_FLOW_COOKIE,
  OAUTH_NEXT_COOKIE,
  readOAuthFlowCookies,
} from "../lib/oauth-flow-cookie";
import { mapProjectSubmitErrorMessage } from "../lib/error-message";
import {
  buildLoginUrlWithReturn,
  buildRegisterUrlWithReturn,
  isGuestEligibleReturnParam,
  LOGIN_INTENT_REGISTERED,
  resolvePostLoginPath,
  sanitizeLoginReturnUrl,
  shouldShowGuestLoginEntry,
} from "../lib/login-return-url";
import { projectThumbnailsForDb, projectThumbnailsForDbUpdate, sanitizeProjectThumbnailUrls } from "../lib/project-thumbnails";
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

function testThumbnailUpdateGuard() {
  const existing = {
    thumbnail_url: "data:image/png;base64,abc",
    thumbnail_urls: ["data:image/png;base64,abc"],
  };

  ok(
    projectThumbnailsForDbUpdate([], existing) === null,
    "thumbnail update: empty incoming preserves existing (no allowClear)",
  );

  ok(
    projectThumbnailsForDbUpdate([], existing, { allowClear: true })?.thumbnail_url === null,
    "thumbnail update: explicit clear writes null",
  );

  ok(
    projectThumbnailsForDbUpdate(
      ["data:image/png;base64,abc"],
      existing,
    ) === null,
    "thumbnail update: unchanged list omitted",
  );

  const changed = projectThumbnailsForDbUpdate(
    ["https://new/thumb.jpg"],
    existing,
  );
  ok(changed?.thumbnail_url === "https://new/thumb.jpg", "thumbnail update: real change writes");
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
    sanitizeLoginReturnUrl("/search?q=Staging") === "/search?q=Staging",
    "allow works search return with query",
  );
  ok(
    sanitizeLoginReturnUrl("/search/creators?q=forge&sort=followers") ===
      "/search/creators?q=forge&sort=followers",
    "allow creator search return",
  );
  ok(
    sanitizeLoginReturnUrl("/creators/dev-1") === "/creators/dev-1",
    "allow creator profile return",
  );
  ok(
    isGuestEligibleReturnParam("/search?q=Staging") === true,
    "guest eligible for search return",
  );
  ok(
    sanitizeLoginReturnUrl("/games/abc?tab=devlog") === "/games/abc?tab=devlog",
    "allow game detail devlog tab",
  );
  ok(
    buildRegisterUrlWithReturn("/games/abc?tab=voices") ===
      "/register?return=%2Fgames%2Fabc%3Ftab%3Dvoices",
    "register url carries sanitized return",
  );
  ok(buildRegisterUrlWithReturn("//evil.com") === "/register", "reject unsafe register return");
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
  ok(sanitizeLoginReturnUrl("/mypage") === "/mypage", "allow mypage path");
  ok(sanitizeLoginReturnUrl("/mypage/profile") === "/mypage/profile", "allow mypage profile");
  ok(sanitizeLoginReturnUrl("/settings") === "/settings", "allow settings path");
  ok(
    sanitizeLoginReturnUrl("/studio/profile") === "/studio/profile",
    "allow studio profile return (Studio Shell canonical)",
  );
  ok(
    sanitizeLoginReturnUrl("/studio/settings") === "/settings",
    "canonicalize studio settings return to settings",
  );
  ok(
    buildLoginUrlWithReturn("/studio/profile") ===
      "/login?return=%2Fstudio%2Fprofile",
    "login URL from studio profile keeps studio return",
  );
  ok(
    buildLoginUrlWithReturn("/studio/settings") ===
      "/login?return=%2Fsettings",
    "login URL from studio settings uses canonical return",
  );
  ok(
    isGuestEligibleReturnParam("/games/abc?tab=voices") === true,
    "guest eligible for game detail return",
  );
  ok(
    isGuestEligibleReturnParam("/studio/mypage") === false,
    "guest ineligible for studio return",
  );
  ok(
    shouldShowGuestLoginEntry("/games/abc", LOGIN_INTENT_REGISTERED) === false,
    "registered intent hides guest for game detail return",
  );
  ok(
    shouldShowGuestLoginEntry("/games/abc", null) === true,
    "no intent allows guest for game detail return",
  );
  ok(
    shouldShowGuestLoginEntry(null, null) === true,
    "plain /login shows guest entry (defaults to /home)",
  );
  ok(
    shouldShowGuestLoginEntry("", null) === true,
    "empty return shows guest entry",
  );
  ok(
    shouldShowGuestLoginEntry("/home", null) === true,
    "home return shows guest entry",
  );
  ok(
    shouldShowGuestLoginEntry("/studio", null) === false,
    "studio return hides guest entry",
  );
  ok(
    shouldShowGuestLoginEntry(null, LOGIN_INTENT_REGISTERED) === false,
    "registered intent hides guest even without return",
  );
  ok(
    buildLoginUrlWithReturn("/games/abc", { intent: LOGIN_INTENT_REGISTERED }) ===
      "/login?return=%2Fgames%2Fabc&intent=registered",
    "login url carries registered intent",
  );
  ok(resolvePostLoginPath(null) === "/home", "no-return login defaults to /home");
  ok(
    resolvePostLoginPath("/studio/mypage") === "/studio/mypage",
    "explicit studio return preserved after login",
  );
  ok(sanitizeLoginReturnUrl("/bookmarks") === "/bookmarks", "allow bookmarks path");
  ok(
    sanitizeLoginReturnUrl("/notifications") === "/notifications",
    "allow notifications path",
  );
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
  ).replace(/\r\n/g, "\n");
  const projects = fs.readFileSync(
    path.join(import.meta.dirname, "../lib/supabase/projects.ts"),
    "utf8",
  );
  const search = fs.readFileSync(
    path.join(import.meta.dirname, "../components/works-search-page.tsx"),
    "utf8",
  );

  ok(provider.includes("publicGames"), "games-provider exposes publicGames");
  ok(provider.includes("publicCatalogReady"), "games-provider exposes publicCatalogReady");
  ok(provider.includes("refreshPublicCatalog"), "games-provider exposes refreshPublicCatalog");
  ok(provider.includes("fetchPublicProjects"), "games-provider imports fetchPublicProjects");
  const mountEffectStart = provider.indexOf("setHydrated(true);");
  const authCatalogEffect = provider.indexOf(
    'if (!authHydrated) {\n      return;\n    }\n\n    if (!user) {\n      setUserEngagement',
  );
  const mountEffect =
    mountEffectStart > -1 && authCatalogEffect > mountEffectStart
      ? provider.slice(mountEffectStart, authCatalogEffect)
      : "";
  ok(
    mountEffect.length > 0 && !mountEffect.includes("void reloadPublicCatalog()"),
    "public catalog does not load on provider mount",
  );
  ok(
    !provider.includes("requestIdleCallback") &&
      !provider.includes("deferForHome"),
    "public catalog has no idle-deferred /home fetch",
  );
  ok(
    search.includes("void refreshPublicCatalog()"),
    "/search triggers the public catalog refresh",
  );
  ok(
    provider.includes("setPublicCatalogReady(true)") &&
      provider.indexOf("setPublicCatalogReady(true)") >
        provider.indexOf("const reloadPublicCatalog = useCallback"),
    "reloadPublicCatalog owns publicCatalogReady completion",
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

  ok(
    home.includes("fetchHomeDiscoveryFeed") || home.includes("get_home_discovery_feed"),
    "discovery-home loads via home discovery feed RPC",
  );
  ok(!home.includes("dataReady"), "discovery-home does not use dataReady");
  ok(!home.includes("submittedGames"), "discovery-home does not use submittedGames");
  ok(!home.includes("useGames("), "discovery-home does not depend on GamesProvider catalog");
  ok(
    home.includes("feed?.newest ?? []") ||
      /newestCarousel\s*=\s*useMemo\(\(\)\s*=>\s*feed\?\.newest/.test(home),
    "newest carousel keeps RPC order",
  );
  ok(
    (home.includes("feed?.updated ?? []") ||
      /updatedCarousel\s*=\s*useMemo\(\(\)\s*=>\s*feed\?\.updated/.test(home)) &&
      (home.includes("feed?.trending ?? []") ||
        /trendingCarousel\s*=\s*useMemo\(\(\)\s*=>\s*feed\?\.trending/.test(
          home,
        )) &&
      !home.includes("buildSectionCarouselItems"),
    "all shelves keep RPC order without hero soft-exclusion",
  );

  ok(search.includes("publicCatalogReady"), "works-search gates on publicCatalogReady");
  ok(search.includes("publicGames"), "works-search reads publicGames");
  ok(
    search.includes("refreshPublicCatalog"),
    "works-search revalidates public catalog on display",
  );
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
    !loginPage.includes("router.replace"),
    "login page does not use router.replace (avoids client navigation ping-pong)",
  );
  ok(
    loginPage.includes("state.redirectTo") &&
      loginPage.includes("window.location.assign"),
    "login page navigates only after successful form submit (redirectTo)",
  );
  ok(
    loginPage.includes("alreadySignedInRedirectStartedRef") &&
      loginPage.includes("window.location.replace"),
    "login page auto-redirects signed-in users once via full navigation",
  );
  ok(
    !loginPage.includes("showContinueLink") && !loginPage.includes("ログイン済みです"),
    "login page does not show passive already-signed-in banner",
  );
  const loginActionSource = fs.readFileSync(
    path.join(import.meta.dirname, "../lib/auth-login-action.ts"),
    "utf8",
  );
  ok(
    loginActionSource.includes("redirectTo") &&
      !loginActionSource.includes("redirect(resolvePostLoginPath"),
    "login action returns redirectTo instead of useActionState-unreliable redirect()",
  );

  ok(authProvider.includes("authResolved"), "auth-provider exposes authResolved");
  ok(
    !authProvider.includes('if (event !== "INITIAL_SESSION")'),
    "auth-provider does not clear user on non-INITIAL_SESSION null session",
  );
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
  ok(
    studioGuard.includes('deploymentMode === "production"'),
    "StudioDirectAccessGuard defers login redirect to middleware in production",
  );
  ok(
    studioGuard.includes('"/studio/settings": "/settings"') &&
      studioGuard.includes("STUDIO_CANONICAL_REDIRECTS") &&
      !studioGuard.includes('"/studio/profile": "/mypage/profile"'),
    "StudioDirectAccessGuard remaps settings stub; profile stays under Studio Shell",
  );

  const middlewareSource = fs.readFileSync(
    path.join(import.meta.dirname, "../middleware.ts"),
    "utf8",
  );
  const legacyRedirects = fs.readFileSync(
    path.join(import.meta.dirname, "../lib/v0-legacy-redirects.ts"),
    "utf8",
  );
  const middlewareFnStart = middlewareSource.indexOf(
    "export async function middleware",
  );
  const callLegacy = middlewareSource.indexOf(
    "resolveV0LegacyRedirect(",
    middlewareFnStart,
  );
  const callUpdateSession = middlewareSource.indexOf(
    "updateSession(request)",
    middlewareFnStart,
  );
  ok(
    middlewareFnStart >= 0 &&
      callLegacy >= 0 &&
      callUpdateSession >= 0 &&
      callLegacy < callUpdateSession,
    "middleware resolves legacy redirects before auth session gate",
  );
  ok(
    !legacyRedirects.includes('"/studio/profile": "/mypage/profile"') &&
      legacyRedirects.includes('"/studio/settings": "/settings"'),
    "legacy redirects map studio settings to canonical; profile stays /studio/profile",
  );
}

function testOAuthRedirectOriginContract() {
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const authRedirect = fs.readFileSync(
    path.join(import.meta.dirname, "../lib/auth-redirect.ts"),
    "utf8",
  );
  const authProvider = fs.readFileSync(
    path.join(import.meta.dirname, "../components/auth-provider.tsx"),
    "utf8",
  );
  const callbackRoute = fs.readFileSync(
    path.join(import.meta.dirname, "../app/auth/callback/route.ts"),
    "utf8",
  );
  const loginPage = fs.readFileSync(
    path.join(import.meta.dirname, "../components/login-page.tsx"),
    "utf8",
  );
  const registerPage = fs.readFileSync(
    path.join(import.meta.dirname, "../components/register-page.tsx"),
    "utf8",
  );
  const xOAuthSection = fs.readFileSync(
    path.join(import.meta.dirname, "../components/x-oauth-login-section.tsx"),
    "utf8",
  );

  ok(
    authRedirect.includes("getClientAuthOrigin") &&
      authRedirect.includes("window.location.origin"),
    "OAuth redirect uses browser origin",
  );
  ok(
    authRedirect.includes('flow === "x_link"') &&
      authRedirect.includes("/settings?x=linked"),
    "x_link callback resolves to /settings?x=linked",
  );
  ok(
    authProvider.includes('setOAuthFlowCookies("x_login"') &&
      authProvider.includes('setOAuthFlowCookies("x_link"'),
    "auth-provider stores X OAuth flow in cookies",
  );
  ok(
    authProvider.includes("getOAuthRedirectUrl()") &&
      !authProvider.includes("getOAuthRedirectUrl(nextPath"),
    "auth-provider uses queryless OAuth redirectTo",
  );
  ok(
    callbackRoute.includes("readOAuthFlowCookies") &&
      callbackRoute.includes("exchangeCodeForSession") &&
      callbackRoute.includes("createRouteHandlerSupabase") &&
      callbackRoute.includes("settingsXErrorPath") &&
      !callbackRoute.includes("NEXT_PUBLIC_SITE_URL"),
    "callback route uses request cookies and granular x_link errors",
  );
  ok(
    loginPage.includes("XOAuthLoginSection") &&
      loginPage.includes("DEFAULT_POST_PLAYER_HOME_PATH") &&
      !loginPage.includes("OAuthComingSoonSection") &&
      !loginPage.includes("Google / Discord / GitHub"),
    "login page uses current X OAuth UI and player home default",
  );
  ok(
    registerPage.includes("DEFAULT_POST_PLAYER_HOME_PATH") &&
      registerPage.includes("XOAuthLoginSection"),
    "register page X OAuth defaults to player home",
  );
  ok(
    xOAuthSection.includes("Xでログイン") && !xOAuthSection.includes("続ける"),
    "X OAuth button label is Xでログイン",
  );
}

function testOAuthRedirectUrlValues() {
  const previewOrigin =
    "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";
  const prodOrigin = "https://forge-flame-gamma.vercel.app";

  const previewRedirect = buildOAuthCallbackRedirectUrl(previewOrigin);
  const previewUrl = new URL(previewRedirect);
  ok(previewUrl.origin === previewOrigin, `preview redirect origin: ${previewUrl.origin}`);
  ok(previewUrl.pathname === "/auth/callback", `preview redirect path: ${previewUrl.pathname}`);
  ok(previewUrl.search === "", "OAuth redirectTo must not include query params");
  ok(!previewRedirect.includes(prodOrigin), "preview redirect must not use production origin");

  const prodRedirect = buildOAuthCallbackRedirectUrl(prodOrigin);
  ok(new URL(prodRedirect).origin === prodOrigin, "production redirect origin");
  ok(new URL(prodRedirect).search === "", "production redirectTo has no query");

  const cookieState = readOAuthFlowCookies((name) => {
    if (name === OAUTH_FLOW_COOKIE) {
      return "x_link";
    }
    if (name === OAUTH_NEXT_COOKIE) {
      return encodeURIComponent("/settings");
    }
    return undefined;
  });
  ok(cookieState.flow === "x_link", "cookie flow read");
  ok(cookieState.next === "/settings", "cookie next read");

  ok(
    resolveOAuthCallbackDestination({ flow: "x_link", next: "/settings" }) ===
      "/settings?x=linked",
    "x_link success destination",
  );
  ok(
    resolveOAuthCallbackErrorPath("x_link") ===
      "/settings?x=error&reason=callback_failed",
    "x_link error destination",
  );
  ok(
    resolveOAuthCallbackDestination({ flow: "x_login", next: "/home" }) === "/home",
    "x_login success uses cookie next (/home default)",
  );
  ok(
    resolveOAuthCallbackDestination({
      flow: "x_login",
      next: "/studio/mypage",
    }) === "/studio/mypage",
    "x_login respects explicit cookie next when set",
  );
  ok(
    resolveOAuthCallbackErrorPath("x_login") === "/login?error=auth_callback",
    "x_login error destination",
  );
  ok(
    normalizeOAuthFailureReason({ errorCode: "identity_already_exists" }) ===
      "x_account_already_linked",
    "identity_already_exists maps to x_account_already_linked",
  );
  ok(
    normalizeOAuthFailureReason({
      exchangeMessage: "Identity is already linked to another user",
    }) === "x_account_already_linked",
    "exchange already linked maps to x_account_already_linked",
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
    "login page resolves post-login path for signed-in redirect",
  );
  ok(
    loginPage.includes("alreadySignedInRedirectStartedRef"),
    "login page guards signed-in auto redirect to once",
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
    ["thumbnail update guard", testThumbnailUpdateGuard],
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
    ["OAuth redirect origin contract", testOAuthRedirectOriginContract],
    ["OAuth redirect URL values", testOAuthRedirectUrlValues],
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
