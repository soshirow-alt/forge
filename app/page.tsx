import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";
import { isProductionReleaseMode } from "@/lib/production-mode";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Forge — ゲームを、育てる場所。",
  description:
    "プレイヤーのフィードバックが、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。",
};

/**
 * Preview v0（mock UI 確認）: `/` → 発見ホームへ。
 * 本番同等モード: 未ログイン = LP、ログイン済 = `/home`（オーナー方針: `/` 出し分け）。
 */
export default async function RootPage() {
  if (!isProductionReleaseMode()) {
    redirect("/home");
  }

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/home");
    }
  }

  return <LandingPage logoHref="/" />;
}
