import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import {
  landingMockFeaturedGames,
  loadLandingFeaturedGames,
} from "@/lib/landing-featured-games";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Forge — 作品を、育てる場所。",
  description:
    "Forgeは、ゲーム・音楽・音声・アセット・開発ツール・サービスなど、完成前や発展途中の作品を見つけ、試し、フィードバックし、新しいつながりを生み出すプラットフォームです。",
  openGraph: {
    title: "Forge — 作品を、育てる場所。",
    description:
      "Forgeは、ゲーム・音楽・音声・アセット・開発ツール・サービスなど、完成前や発展途中の作品を見つけ、試し、フィードバックし、新しいつながりを生み出すプラットフォームです。",
  },
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
