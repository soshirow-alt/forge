/**
 * Minimal read-only OGP — static verification (no DB / Storage).
 *
 * Usage: npm run verify:minimal-readonly-ogp
 */
import { buildGameDetailMetadata } from "../lib/game-detail-metadata";
import {
  DEFAULT_GAME_OG_PATH,
  pickHttpThumbnailForOg,
  resolveOgImageUrl,
  resolveProjectOgImageUrl,
} from "../lib/og-image-url";
import type { ProjectOgData } from "../lib/supabase/project-og";

const ORIGIN = "https://forge.example.com";
process.env.NEXT_PUBLIC_SITE_URL = ORIGIN;

function firstImageUrl(images: unknown): string {
  if (!images) return "";
  const list = Array.isArray(images) ? images : [images];
  const first = list[0];
  if (!first) return "";
  if (typeof first === "string") return first;
  if (typeof first === "object" && first !== null && "url" in first) {
    const url = (first as { url?: string | URL }).url;
    return typeof url === "string" ? url : url instanceof URL ? url.toString() : "";
  }
  return "";
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL ${message}`);
    process.exit(1);
  }
  console.log(`PASS ${message}`);
}

const httpThumb = "https://cdn.example.com/thumb.jpg";
const dataThumb =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

assert(
  pickHttpThumbnailForOg({
    thumbnail_urls: [dataThumb, httpThumb],
    thumbnail_url: null,
  }) === httpThumb,
  "pickHttpThumbnailForOg skips data URL, keeps https",
);

assert(
  pickHttpThumbnailForOg({
    thumbnail_urls: [dataThumb],
    thumbnail_url: dataThumb,
  }) === null,
  "pickHttpThumbnailForOg returns null for data-only thumbs",
);

const defaultAbs = resolveOgImageUrl(null, ORIGIN);
assert(
  defaultAbs === `${ORIGIN}${DEFAULT_GAME_OG_PATH}`,
  "resolveOgImageUrl null → default png absolute",
);

assert(
  resolveOgImageUrl(dataThumb, ORIGIN) === defaultAbs,
  "resolveOgImageUrl data URL → default (never data: in og:image)",
);

assert(
  resolveOgImageUrl(httpThumb, ORIGIN) === httpThumb,
  "resolveOgImageUrl https → unchanged",
);

assert(
  !resolveProjectOgImageUrl("proj-id", dataThumb, ORIGIN).includes("data:"),
  "resolveProjectOgImageUrl never returns data: URL",
);

assert(
  !resolveProjectOgImageUrl("proj-id", dataThumb, ORIGIN).includes("/api/projects/"),
  "resolveProjectOgImageUrl does not route to og-image API",
);

const project: ProjectOgData = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Test Game",
  description: "Catch copy for OGP.",
  overviewIntroduction: "",
  playableVersion: "0.1",
  phase: "試作版",
  releaseStatus: "in_development",
  thumbnailUrl: httpThumb,
};

const meta = buildGameDetailMetadata(project);
const ogImageUrl = firstImageUrl(meta.openGraph?.images);
const twitterImage = firstImageUrl(meta.twitter?.images);

assert(Boolean(meta.openGraph?.title?.toString().includes("Test Game")), "og:title present");
assert(Boolean(meta.openGraph?.description), "og:description present");
assert(
  meta.alternates?.canonical === `${ORIGIN}/games/${project.id}`,
  "og:url / canonical present",
);
assert(ogImageUrl === httpThumb, "og:image uses https thumbnail");
assert(twitterImage === httpThumb, "twitter:image uses https thumbnail");
const twitterCard =
  meta.twitter && typeof meta.twitter === "object" && "card" in meta.twitter
    ? String(meta.twitter.card)
    : "";
assert(twitterCard === "summary_large_image", "twitter:card summary_large_image");
const projectOgImages = meta.openGraph?.images;
const projectOgFirst = Array.isArray(projectOgImages)
  ? projectOgImages[0]
  : projectOgImages;
assert(
  Boolean(
    projectOgFirst &&
      typeof projectOgFirst === "object" &&
      !("width" in projectOgFirst && projectOgFirst.width === 1200),
  ),
  "per-game og image does not fake fixed 1200 width",
);

const noThumbMeta = buildGameDetailMetadata({ ...project, thumbnailUrl: null });
const noThumbOg = firstImageUrl(noThumbMeta.openGraph?.images);
assert(
  noThumbOg === `${ORIGIN}${DEFAULT_GAME_OG_PATH}`,
  "no thumbnail → default og:image",
);
const defaultImages = noThumbMeta.openGraph?.images;
const defaultFirst = Array.isArray(defaultImages) ? defaultImages[0] : defaultImages;
assert(
  Boolean(
    defaultFirst &&
      typeof defaultFirst === "object" &&
      "width" in defaultFirst &&
      defaultFirst.width === 1200 &&
      "type" in defaultFirst &&
      defaultFirst.type === "image/png",
  ),
  "default og image includes 1200×630 png metadata",
);

console.log("\nAll minimal read-only OGP checks passed.");
