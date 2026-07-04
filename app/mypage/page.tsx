"use client";

import { Suspense } from "react";
import { MyPagePage } from "@/components/mypage-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <RegisteredAccountGuard>
        <MyPagePage />
      </RegisteredAccountGuard>
    </Suspense>
  );
}
