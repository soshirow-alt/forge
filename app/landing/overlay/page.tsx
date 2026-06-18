import { LandingOverlayTool } from "@/components/landing-overlay-tool";

export const metadata = {
  title: "Forge LP — Mock Overlay",
  robots: { index: false, follow: false },
};

/** preview 専用 — モック原寸と実装の比較（左右 / 重ね / 切替） */
export default function LandingOverlayPage() {
  return (
    <main className="min-h-dvh bg-[#050508]">
      <LandingOverlayTool />
    </main>
  );
}
