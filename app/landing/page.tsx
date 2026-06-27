import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { isProductionReleaseMode } from "@/lib/production-mode";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Forge — ゲームを、育てる場所。",
  description:
    "プレイヤーのフィードバックが、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。",
};

/** Preview 確認用 `/landing`。本番同等モードではログイン済みなら `/home` へ。 */
export default async function LandingRoute() {
  if (isProductionReleaseMode()) {
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        redirect("/home");
      }
    }
  }

  return <LandingPage logoHref="/landing" />;
}
