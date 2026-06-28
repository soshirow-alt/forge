import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import {
  landingMockFeaturedGames,
  loadLandingFeaturedGames,
} from "@/lib/landing-featured-games";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Forge — ゲームを、育てる場所。",
  description:
    "プレイヤーのフィードバックが、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。",
};

/** `/` — 未ログイン = LP（公開入口）。ログイン済 = 発見ホームへ。 */
export default async function RootPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/home");
    }
  }

  const useMockContent = !shouldHideV0MockContent();
  const featuredGames = useMockContent
    ? landingMockFeaturedGames
    : await loadLandingFeaturedGames();

  return (
    <LandingPage
      logoHref="/"
      featuredGames={featuredGames}
      useMockContent={useMockContent}
    />
  );
}
