import { headers } from "next/headers";
import { blockDemoRouteOnProduction } from "@/lib/demo/demo-route-guard";

export default async function ScreenshotDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host") ?? undefined;
  blockDemoRouteOnProduction(host);
  return children;
}
