"use client";

import { StudioDirectAccessGuard } from "@/components/studio-entry-gate-provider";

/** Studio 配下で1回だけマウント — ページ遷移のたびにガードが再実行されない */
export function StudioAccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StudioDirectAccessGuard />
      {children}
    </>
  );
}
