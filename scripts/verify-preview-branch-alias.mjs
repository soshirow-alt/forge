#!/usr/bin/env node
/**
 * Preview 完了条件: branch alias が「単発 deploy URL」ではなく
 * 期待する最新 bundle を配信していること。
 *
 * 正本 alias:
 *   https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
 *
 * Usage:
 *   node scripts/verify-preview-branch-alias.mjs
 *   PREVIEW_ALIAS_URL=... EXPECT_COMMIT=… node scripts/verify-preview-branch-alias.mjs
 *   COMPARE_DEPLOY_URL=https://forge-….vercel.app node scripts/verify-preview-branch-alias.mjs
 *
 * 2026-07-25〜: Preview `/home` = カテゴリ拡張後の将来ホーム（24 fixture）。
 * `/explore/prototype` 一覧は `/home` へ redirect。詳細は維持。
 */

const ALIAS_URL =
  process.env.PREVIEW_ALIAS_URL ||
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";

const COMPARE_DEPLOY_URL = process.env.COMPARE_DEPLOY_URL || "";
const EXPECT_COMMIT = (process.env.EXPECT_COMMIT || "").trim();

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "forge-verify-preview-branch-alias/1.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

async function fetchRedirect(url) {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "forge-verify-preview-branch-alias/1.0" },
  });
  return {
    status: res.status,
    location: res.headers.get("location") || "",
  };
}

function extractChunkPaths(html) {
  const paths = new Set();
  for (const m of html.matchAll(/\/_next\/static\/chunks\/[^"'\\\s]+/g)) {
    paths.add(m[0].replace(/\\$/, ""));
  }
  return [...paths];
}

async function collectBundleText(baseUrl, path = "/") {
  const origin = baseUrl.replace(/\/$/, "");
  const html = await fetchText(`${origin}${path}`);
  const paths = extractChunkPaths(html);
  const parts = [html];
  for (const chunkPath of paths) {
    if (!chunkPath.endsWith(".js") && !chunkPath.endsWith(".css")) continue;
    try {
      parts.push(await fetchText(`${origin}${chunkPath}`));
    } catch {
      // Chunk may 404 on partial matches; ignore.
    }
  }
  return {
    text: parts.join("\n"),
    chunkPaths: paths,
    html,
  };
}

function count(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = 0;
  while (true) {
    const j = haystack.indexOf(needle, i);
    if (j < 0) break;
    n += 1;
    i = j + needle.length;
  }
  return n;
}

function chunkFingerprint(paths) {
  return paths
    .filter((p) => p.endsWith(".js") || p.endsWith(".css"))
    .map((p) => p.split("/").pop())
    .sort()
    .join("|");
}

function locationTargetsHome(location, expectedQueryPrefix) {
  if (!location) return false;
  try {
    const url = new URL(location, ALIAS_URL);
    if (url.pathname !== "/home") return false;
    if (!expectedQueryPrefix) return true;
    return url.search.includes(expectedQueryPrefix);
  } catch {
    return location.includes("/home");
  }
}

async function main() {
  console.log(`alias: ${ALIAS_URL}`);
  if (EXPECT_COMMIT) console.log(`expect commit: ${EXPECT_COMMIT}`);
  if (COMPARE_DEPLOY_URL) console.log(`compare deploy: ${COMPARE_DEPLOY_URL}`);

  const failures = [];
  const origin = ALIAS_URL.replace(/\/$/, "");

  const aliasRoot = await collectBundleText(ALIAS_URL, "/");
  const aliasFp = chunkFingerprint(aliasRoot.chunkPaths);
  console.log(
    `alias distinctive chunks: ${aliasFp.split("|").slice(-6).join(", ")}`,
  );

  // Preview /home — single future discovery surface (fixtures).
  const home = await collectBundleText(ALIAS_URL, "/home");
  const homeHasLabel = count(home.html, ">ホーム<") > 0;
  const homeHasExploreLabel = count(home.html, ">Explore<") > 0;
  const homeFuture =
    count(home.html, "草原ダッシュ") > 0 ||
    count(home.html, "explore-prototype-category") > 0 ||
    count(home.html, "注目の作品") > 0;
  const homeHasStagingTmp =
    count(home.html, "tmp-062") > 0 || count(home.html, "Neon Depths") > 0;
  console.log(`home ">ホーム<": ${homeHasLabel ? 1 : 0}`);
  console.log(`home ">Explore<": ${homeHasExploreLabel ? 1 : 0}`);
  console.log(`home future markers: ${homeFuture ? 1 : 0}`);
  console.log(`home staging-tmp leak: ${homeHasStagingTmp ? 1 : 0}`);
  if (!homeHasLabel) failures.push('alias /home missing sidebar label "ホーム"');
  if (homeHasExploreLabel) {
    failures.push('alias /home still labels primary nav as "Explore"');
  }
  if (!homeFuture) {
    failures.push("alias /home missing future discovery / fixture markers");
  }
  if (homeHasStagingTmp) {
    failures.push("alias /home still embeds Staging tmp/hero-seed titles in HTML");
  }

  // Removed dual Production-home route.
  const retired = await fetch(`${origin}/prototype/production-home`, {
    redirect: "manual",
    headers: { "user-agent": "forge-verify-preview-branch-alias/1.0" },
  });
  console.log(`retired production-home HTTP ${retired.status}`);
  if (retired.status !== 404) {
    failures.push(
      `alias /prototype/production-home expected 404, got ${retired.status}`,
    );
  }

  // Compatibility redirects (list only; details stay).
  const redirectChecks = [
    { path: "/explore/prototype", expect: null },
    { path: "/explore/prototype?q=neon", expect: "q=neon" },
    { path: "/explore/prototype/game", expect: "category=game" },
    { path: "/explore/prototype/audio?q=pulse", expect: "category=audio" },
  ];
  for (const check of redirectChecks) {
    const result = await fetchRedirect(`${origin}${check.path}`);
    const ok =
      (result.status === 307 || result.status === 308 || result.status === 302) &&
      locationTargetsHome(result.location, check.expect);
    console.log(
      `redirect ${check.path} → ${result.status} ${result.location || "(none)"} ok=${ok ? 1 : 0}`,
    );
    if (!ok) {
      failures.push(`compat redirect failed for ${check.path}`);
    }
  }

  const detail = await fetch(`${origin}/explore/prototype/game/meadow-dash`, {
    redirect: "manual",
    headers: { "user-agent": "forge-verify-preview-branch-alias/1.0" },
  });
  console.log(`detail meadow-dash HTTP ${detail.status}`);
  if (detail.status !== 200) {
    failures.push(`detail /explore/prototype/game/meadow-dash HTTP ${detail.status}`);
  }

  const protoHub = await collectBundleText(ALIAS_URL, "/prototype");
  const productionHomeLinked =
    count(protoHub.html, "/prototype/production-home") > 0 ||
    count(protoHub.text, "/prototype/production-home") > 0;
  const categoryProtoLinked =
    count(protoHub.html, "view=category-proto") > 0 ||
    count(protoHub.text, "view=category-proto") > 0;
  const homeLinked =
    count(protoHub.html, 'href="/home"') > 0 ||
    count(protoHub.html, "href=/home") > 0 ||
    count(protoHub.text, '"/home"') > 0;
  console.log(`prototype hub /home link: ${homeLinked ? 1 : 0}`);
  console.log(`prototype hub production-home link: ${productionHomeLinked ? 1 : 0}`);
  console.log(`prototype hub category-proto link: ${categoryProtoLinked ? 1 : 0}`);
  if (!homeLinked) {
    failures.push("alias /prototype missing /home link");
  }
  if (productionHomeLinked) {
    failures.push("alias /prototype still links /prototype/production-home");
  }
  if (!categoryProtoLinked) {
    failures.push(
      "alias /prototype missing dedicated category-proto submit link",
    );
  }

  const categoryProtoRes = await fetch(
    `${origin}/studio/submit?view=category-proto`,
    {
      redirect: "manual",
      headers: { "user-agent": "forge-verify-preview-branch-alias/1.0" },
    },
  );
  const categoryProtoReachable =
    categoryProtoRes.status === 200 ||
    categoryProtoRes.status === 307 ||
    categoryProtoRes.status === 302 ||
    categoryProtoRes.status === 303;
  console.log(
    `category-proto HTTP ${categoryProtoRes.status} (reachable=${categoryProtoReachable})`,
  );
  if (!categoryProtoReachable) {
    failures.push(
      `alias /studio/submit?view=category-proto unexpected status ${categoryProtoRes.status}`,
    );
  }

  if (COMPARE_DEPLOY_URL) {
    const deploy = await collectBundleText(COMPARE_DEPLOY_URL, "/");
    const deployFp = chunkFingerprint(deploy.chunkPaths);
    console.log(
      `deploy distinctive chunks: ${deployFp.split("|").slice(-6).join(", ")}`,
    );
    if (aliasFp !== deployFp) {
      failures.push(
        "alias chunk fingerprint != compare deploy fingerprint (branch alias not on latest Ready deploy)",
      );
    } else {
      console.log("alias chunk fingerprint matches compare deploy");
    }
  }

  if (failures.length > 0) {
    console.error("\nFAIL — preview branch alias checks:");
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log(
    "\nPASS — branch alias serves single future /home + compat redirects",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
