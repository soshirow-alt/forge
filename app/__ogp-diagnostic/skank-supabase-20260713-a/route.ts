import {
  OGP_DIAGNOSTIC_PATH_A,
  SKANK_SUPABASE_OG_IMAGE_URL,
  absolutePageUrl,
  buildDiagnosticOgHtml,
  diagnosticHtmlResponse,
} from "@/lib/ogp-diagnostic";

export const runtime = "nodejs";

function html(request: Request): Response {
  const pageUrl = absolutePageUrl(request, OGP_DIAGNOSTIC_PATH_A);
  return diagnosticHtmlResponse(
    buildDiagnosticOgHtml({
      pageUrl,
      imageUrl: SKANK_SUPABASE_OG_IMAGE_URL,
    }),
  );
}

export function GET(request: Request) {
  return html(request);
}

export function HEAD(request: Request) {
  const res = html(request);
  return new Response(null, { status: 200, headers: res.headers });
}
