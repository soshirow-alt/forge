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
 *   PREVIEW_ALIAS_URL=... EXPECT_COMMIT=9295fac node scripts/verify-preview-branch-alias.mjs
 *   COMPARE_DEPLOY_URL=https://forge-….vercel.app node scripts/verify-preview-branch-alias.mjs
 */

const ALIAS_URL =
  process.env.PREVIEW_ALIAS_URL ||
  "https://forge-git-preview-landing-01-soshirow-alts-projects.vercel.app";

const COMPARE_DEPLOY_URL = process.env.COMPARE_DEPLOY_URL || "";
const EXPECT_COMMIT = (process.env.EXPECT_COMMIT || "").trim();

/** Markers that must appear on the owner-facing alias (post-9295fac submit CTA). */
const REQUIRED_SUBSTRINGS = [
  "category-proto",
  "view=category-proto",
];

/**
 * Old studioSubmitModalHref helper returned `/studio/submit` + optional `?q=`.
 * That pattern must be gone from alias home/studio bundles after the CTA fix.
 */
const FORBIDDEN_SUBSTRINGS = ["studio/submit?q="];

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

async function collectBundleText(baseUrl) {
  const origin = baseUrl.replace(/\/$/, "");
  const homeHtml = await fetchText(`${origin}/`);
  const paths = extractChunkPaths(homeHtml);
  const parts = [homeHtml];
  for (const path of paths) {
    if (!path.endsWith(".js") && !path.endsWith(".css")) continue;
    try {
      parts.push(await fetchText(`${origin}${path}`));
    } catch {
      // Chunk may 404 on partial matches; ignore.
    }
  }
  // Studio shell often carries submit CTA strings.
  try {
    const studioHtml = await fetchText(`${origin}/studio`);
    parts.push(studioHtml);
    for (const path of extractChunkPaths(studioHtml)) {
      if (!path.endsWith(".js")) continue;
      try {
        parts.push(await fetchText(`${origin}${path}`));
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* /studio may redirect; home chunks are still useful */
  }
  return {
    text: parts.join("\n"),
    chunkPaths: paths,
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

  const alias = await collectBundleText(ALIAS_URL);
  const aliasFp = chunkFingerprint(alias.chunkPaths);
  console.log(`alias distinctive chunks: ${aliasFp.split("|").slice(-6).join(", ")}`);

  const failures = [];

  for (const s of REQUIRED_SUBSTRINGS) {
    const n = count(alias.text, s);
    console.log(`required ${JSON.stringify(s)}: ${n}`);
    if (n <= 0) failures.push(`alias missing required marker: ${s}`);
  }

  for (const s of FORBIDDEN_SUBSTRINGS) {
    const n = count(alias.text, s);
    console.log(`forbidden ${JSON.stringify(s)}: ${n}`);
    if (n > 0) {
      failures.push(
        `alias still serves old submit helper pattern ${JSON.stringify(s)} (count=${n})`,
      );
    }
  }

  if (COMPARE_DEPLOY_URL) {
    const deploy = await collectBundleText(COMPARE_DEPLOY_URL);
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

  console.log("\nPASS — branch alias serves expected submit CTA bundle");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
