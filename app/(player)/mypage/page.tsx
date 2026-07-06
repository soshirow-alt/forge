"use client";

import { Suspense } from "react";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { MyPagePage } from "@/components/mypage-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function MyPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton lines={4} />}>
      <RegisteredAccountGuard>
        <MyPagePage />
      </RegisteredAccountGuard>
    </Suspense>
  );
}
