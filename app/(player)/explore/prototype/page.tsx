import { redirect } from "next/navigation";
import { buildFutureHomeHref } from "@/lib/prototype/explore-prototype";

/** List hub moved to `/home` — keep path for compatibility. */
export default function ExplorePrototypeIndexPage() {
  redirect(buildFutureHomeHref());
}
