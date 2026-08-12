import { Suspense } from "react";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";
import { StudioNotificationsPage } from "@/components/studio-notifications-page";

export default function StudioNotificationsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <RegisteredAccountGuard>
        <StudioNotificationsPage />
      </RegisteredAccountGuard>
    </Suspense>
  );
}
