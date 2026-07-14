"use client";

import { useEntryMode } from "@/components/entry-mode-provider";
import { DEFAULT_POST_GUEST_LOGIN_PATH } from "@/lib/guest-auth";

export function LandingGuestEntryButton({
  className,
}: {
  className?: string;
}) {
  const { setGuestEntryMode } = useEntryMode();

  return (
    <button
      type="button"
      onClick={() => {
        setGuestEntryMode();
        window.location.assign(DEFAULT_POST_GUEST_LOGIN_PATH);
      }}
      className={className}
    >
      ゲストで作品を見る
    </button>
  );
}
