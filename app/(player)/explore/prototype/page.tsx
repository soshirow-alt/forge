import { redirect } from "next/navigation";
import { buildFutureHomeHref } from "@/lib/prototype/explore-prototype";

/** List hub moved to `/home` — keep path for compatibility. */
export default async function ExplorePrototypeIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  redirect(buildFutureHomeHref({ q: sp.q }));
}
