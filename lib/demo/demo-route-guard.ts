import { notFound } from "next/navigation";

function isDemoRouteAllowedHost(host?: string): boolean {
  if (process.env.VERCEL_ENV === "preview") {
    return true;
  }

  const normalized = (host ?? "").toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized.includes("preview-landing-01")) {
    return true;
  }

  const hostname = normalized.split(":")[0] ?? normalized;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

/**
 * `/demo/*` — 本番 hostname / VERCEL_ENV=production では 404。
 * Preview デプロイ・preview ブランチ alias・local では fixture を開く。
 */
export function blockDemoRouteOnProduction(host?: string): void {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
    return;
  }

  if (!isDemoRouteAllowedHost(host)) {
    notFound();
  }
}
