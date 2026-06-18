import { LandingPageOverlayCompare } from "@/components/landing-page";

export const metadata = {
  title: "Forge LP — Mock Overlay",
  robots: { index: false, follow: false },
};

/** preview 専用 — モック原寸と実装の重ね合わせ確認 */
export default function LandingOverlayPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-4 bg-[#050508] py-6">
      <p className="text-xs text-zinc-500">
        01 LP オーバーレイ比較（上: 実装 / 下: モック原寸）— preview のみ
      </p>
      <LandingPageOverlayCompare opacity={1} />
      <LandingPageOverlayCompare opacity={0.5} />
    </main>
  );
}
