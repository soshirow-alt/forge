import { Suspense } from "react";
import { NotificationsV0Page } from "@/components/notifications-v0-page";
import { RegisteredAccountGuard } from "@/components/registered-account-guard";

export default function Notifications() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#0a0a0a] text-zinc-500">
          読み込み中...
        </div>
      }
    >
      <RegisteredAccountGuard>
        <NotificationsV0Page />
      </RegisteredAccountGuard>
    </Suspense>
  );
}
