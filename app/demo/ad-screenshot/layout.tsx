import { headers } from "next/headers";
import Link from "next/link";
import { blockDemoRouteOnProduction } from "@/lib/demo/demo-route-guard";

export default async function AdScreenshotDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host") ?? undefined;
  blockDemoRouteOnProduction(host);
  return children;
}
