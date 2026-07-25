import { redirect } from "next/navigation";
import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";
import { buildFutureHomeHref } from "@/lib/prototype/explore-prototype";

/** List hub moved to `/home` (legacy) or `/search` (IA) — keep path for compatibility. */
export default function ExplorePrototypeIndexPage() {
  if (shouldServePlayerIaRedesign()) {
    redirect("/home");
  }
  redirect(buildFutureHomeHref());
}
