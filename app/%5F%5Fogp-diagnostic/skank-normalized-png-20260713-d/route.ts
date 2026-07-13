import {
  OGP_DIAGNOSTIC_PATH_D,
  SKANK_NORMALIZED_PNG_PATH,
  absolutePageUrl,
  buildDiagnosticOgHtml,
  diagnosticHtmlResponse,
} from "@/lib/ogp-diagnostic";

export const runtime = "nodejs";

function html(request: Request): Response {
  const pageUrl = absolutePageUrl(request, OGP_DIAGNOSTIC_PATH_D);
  const imageUrl = absolutePageUrl(request, SKANK_NORMALIZED_PNG_PATH);
  return diagnosticHtmlResponse(
    buildDiagnosticOgHtml({
      pageUrl,
      imageUrl,
      imageType: "image/png",
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
