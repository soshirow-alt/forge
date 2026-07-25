import { shouldServePlayerIaRedesign } from "@/lib/player-ia-mode";

/** Public feedback cards include guest rows only in Preview IA mode. */
export function shouldIncludeGuestInPublicFeedbackCards(): boolean {
  return shouldServePlayerIaRedesign();
}
