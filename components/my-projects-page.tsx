"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ForgeHeader } from "@/components/forge-header";

function MyProjectsRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams({ tab: "developer" });
    const focus = searchParams.get("focus");
    if (focus) {
      params.set("focus", focus);
    }
    router.replace(`/mypage?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <ForgeHeader />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-zinc-500">マイページへ移動中...</p>
      </main>
    </div>
  );
}

export function MyProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-zinc-950 text-zinc-100">
          <ForgeHeader />
          <main className="mx-auto max-w-7xl px-6 py-12">
            <p className="text-zinc-500">読み込み中...</p>
          </main>
        </div>
      }
    >
      <MyProjectsRedirectContent />
    </Suspense>
  );
}
