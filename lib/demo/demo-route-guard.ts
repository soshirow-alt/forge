import { notFound } from "next/navigation";
import { isProductionReleaseMode } from "@/lib/production-mode";

/** `/demo/*` — 本番 hostname では 404（本体導線に mock を混ぜない） */
export function blockDemoRouteOnProduction(host?: string): void {
  if (isProductionReleaseMode(host)) {
    notFound();
  }
}
