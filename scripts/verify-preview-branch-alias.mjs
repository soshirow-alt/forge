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
 *   PREVIEW_ALIAS_URL=... EXPECT_COMMIT=db35bcb node scripts/verify-preview-branch-alias.mjs
 *   COMPARE_DEPLOY_URL=https://forge-….vercel.app node scripts/verify-preview-branch-alias.mjs
 *
 * 2026-07-24〜: 正式ルートは Production 相当。Prototype は専用 URL のみ。
 * category-proto を既定 CTA にしない（旧検証の forbidden `studio/submit?q=` は廃止）。
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

async function main() {
  console.log(`alias: ${ALIAS_URL}`);
  if (EXPECT_COMMIT) console.log(`expect commit: ${EXPECT_COMMIT}`);
  if (COMPARE_DEPLOY_URL) console.log(`compare deploy: ${COMPARE_DEPLOY_URL}`);

  const failures = [];

  // Fingerprint from `/` (same as historical collect) for alias↔unique compare.
  const aliasRoot = await collectBundleText(ALIAS_URL, "/");
  const aliasFp = chunkFingerprint(aliasRoot.chunkPaths);
  console.log(
    `alias distinctive chunks: ${aliasFp.split("|").slice(-6).join(", ")}`,
  );

  // Formal /home — Production discovery, not Explore Prototype hub.
  const home = await collectBundleText(ALIAS_URL, "/home");
  const homeHasLabel = count(home.html, ">ホーム<") > 0;
  const homeHasExploreLabel = count(home.html, ">Explore<") > 0;
  const homeIsExploreHub =
    count(home.html, "カテゴリを横断して、注目作品と最近の更新を眺める") > 0;
  console.log(`home ">ホーム<": ${homeHasLabel ? 1 : 0}`);
  console.log(`home ">Explore<": ${homeHasExploreLabel ? 1 : 0}`);
  console.log(`home explore-hub copy: ${homeIsExploreHub ? 1 : 0}`);
  if (!homeHasLabel) failures.push('alias /home missing sidebar label "ホーム"');
  if (homeHasExploreLabel) {
    failures.push('alias /home still labels primary nav as "Explore"');
  }
  if (homeIsExploreHub) {
    failures.push("alias /home still serves Explore Prototype hub as default");
  }

  // Dedicated prototypes remain reachable (studio submit may redirect to login).
  const explore = await collectBundleText(ALIAS_URL, "/explore/prototype");
  const exploreOk =
    count(explore.html, "注目の作品") > 0 ||
    count(explore.html, "/explore/prototype/") > 0;
  console.log(`explore/prototype markers: ${exploreOk ? 1 : 0}`);
  if (!exploreOk) {
    failures.push("alias /explore/prototype missing Explore Prototype markers");
  }

  const protoHub = await collectBundleText(ALIAS_URL, "/prototype");
  const categoryProtoLinked =
    count(protoHub.html, "view=category-proto") > 0 ||
    count(protoHub.text, "view=category-proto") > 0;
  console.log(`prototype hub category-proto link: ${categoryProtoLinked ? 1 : 0}`);
  if (!categoryProtoLinked) {
    failures.push(
      "alias /prototype missing dedicated category-proto submit link",
    );
  }

  // Unauthenticated GET should not 404 — login redirect is OK for Studio.
  const categoryProtoRes = await fetch(
    `${ALIAS_URL.replace(/\/$/, "")}/studio/submit?view=category-proto`,
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

  // Formal default submit helper should remain Production-shaped.
  const formalSubmitHelper =
    count(home.text, 'studio/submit?q=') +
    count(home.text, '"/studio/submit"') +
    count(home.text, "`/studio/submit`");
  console.log(`formal /studio/submit helper signals: ${formalSubmitHelper}`);

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

  if (failures.length) {
    console.error("\nFAIL — Preview branch alias is not serving the expected bundle:");
    for (const f of failures) console.error(` - ${f}`);
    console.error(`
Recovery (no VERCEL_TOKEN required — Dashboard once):
 1. Vercel → project forge → Deployments → latest Ready for branch preview/landing-01
 2. Confirm Git branch metadata is preview/landing-01 (not detached / CLI-only)
 3. Settings → Domains → forge-git-preview-landing-01-soshirow-alts-projects.vercel.app
    → assign to Git Branch "preview/landing-01" (NOT a specific Deployment)
 4. Do NOT run: vercel alias set <deployment> forge-git-preview-landing-01-...
    (that pins the automatic git branch hostname to one deploy)
 5. Re-run: node scripts/verify-preview-branch-alias.mjs
`);
    process.exit(1);
  }

  console.log(
    "\nPASS — branch alias serves formal Production routes + dedicated prototypes",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
