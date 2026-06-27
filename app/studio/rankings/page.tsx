import {
  StudioRankingsComingSoonPage,
  StudioRankingsLivePage,
} from "@/components/studio-rankings-page";
import { shouldHideV0MockContent } from "@/lib/production-mode";

export const dynamic = "force-dynamic";

export default function StudioRankingsRoute() {
  if (shouldHideV0MockContent()) {
    return <StudioRankingsComingSoonPage />;
  }

  return <StudioRankingsLivePage />;
}
