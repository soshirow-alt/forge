/** Temporary X-card host A/B diagnostics. Do not use for product UI. */

export const SKANK_OG_TITLE = "Skank Boost - スカンク、飛び立て | Forge";
export const SKANK_OG_DESCRIPTION =
  "おならで飛んで、蜂を避けて、虹をつかめ！";

export const SKANK_SUPABASE_OG_IMAGE_URL =
  "https://bpnisgzxuwdxelhnduuf.supabase.co/storage/v1/object/public/project-thumbnails/9e982bea-c402-4a6c-a3f1-9d8726aba475/og-ae21e70d34c58acf-1200x630.jpg";

export const SKANK_FORGE_OG_IMAGE_PATH =
  "/__ogp-diagnostic-image/skank-ae21e70d34c58acf-1200x630.jpg";

export const OGP_DIAGNOSTIC_PATH_A =
  "/__ogp-diagnostic/skank-supabase-20260713-a";
export const OGP_DIAGNOSTIC_PATH_B =
  "/__ogp-diagnostic/skank-forge-20260713-b";

export const OG_W = 1200;
export const OG_H = 630;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function absolutePageUrl(request: Request, pathname: string): string {
  const origin = new URL(request.url).origin;
  return `${origin}${pathname}`;
}

export function buildDiagnosticOgHtml(opts: {
  pageUrl: string;
  imageUrl: string;
  title?: string;
  description?: string;
}): string {
  const title = escapeHtml(opts.title ?? SKANK_OG_TITLE);
  const description = escapeHtml(opts.description ?? SKANK_OG_DESCRIPTION);
  const pageUrl = escapeHtml(opts.pageUrl);
  const imageUrl = escapeHtml(opts.imageUrl);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${title}</title>
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="${OG_W}">
<meta property="og:image:height" content="${OG_H}">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">
</head>
<body>
<p>OGP diagnostic (temporary).</p>
</body>
</html>
`;
}

export function diagnosticHtmlResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
