import { notFound } from "next/navigation";

function isDemoRouteAllowedHost(host?: string): boolean {
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
 * `/demo/*` — 本番 hostname では 404。
 * Preview hostname / local では `NEXT_PUBLIC_FORGE_PRODUCTION_MODE` が付いていても fixture を開く。
 */
export function blockDemoRouteOnProduction(host?: string): void {
  if (!isDemoRouteAllowedHost(host)) {
    notFound();
  }
}
