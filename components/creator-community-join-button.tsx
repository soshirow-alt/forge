"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
  applyCommunityMembership,
  fetchCommunityMembershipStatus,
  fetchDeveloperCommunityByOwner,
} from "@/lib/supabase/community-db";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { Users } from "lucide-react";

type CreatorCommunityJoinButtonProps = {
  developerUserId: string;
  /** Compact secondary CTA near Follow (not a hero primary). */
  variant?: "default" | "secondary";
};

export function CreatorCommunityJoinButton({
  developerUserId,
  variant = "default",
}: CreatorCommunityJoinButtonProps) {
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [status, setStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shouldHideV0MockContent()) {
      setLoaded(true);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const community = await fetchDeveloperCommunityByOwner(supabase, developerUserId);
      if (cancelled) {
        return;
      }
      if (!community) {
        setLoaded(true);
        return;
      }
      setCommunityId(community.id);
      if (user) {
        const membership = await fetchCommunityMembershipStatus(
          supabase,
          community.id,
          user.id,
        );
        setStatus(membership);
      }
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [developerUserId, user?.id]);

  if (!shouldHideV0MockContent() || !loaded || !communityId || user?.id === developerUserId) {
    return null;
  }

  const compact = variant === "secondary";
  const sizeClass = compact
    ? "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium"
    : "inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold";
  const iconClass = compact ? "size-3.5" : "size-4";

  if (status === "approved") {
    return (
      <Link
        href={`/mypage/community?community=${encodeURIComponent(communityId)}`}
        className={`${sizeClass} border-emerald-500/40 bg-emerald-500/10 text-emerald-300`}
      >
        <Users className={iconClass} aria-hidden="true" />
        コミュニティ参加中
      </Link>
    );
  }

  if (status === "pending") {
    return (
      <span
        className={`${sizeClass} border-amber-500/30 bg-amber-500/10 text-amber-300`}
      >
        <Users className={iconClass} aria-hidden="true" />
        参加申請中
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        requireAuth(
          async () => {
            const supabase = getOptionalSupabaseClient();
            if (!supabase || !communityId) {
              return;
            }
            await applyCommunityMembership(supabase, communityId, user!.id);
            setStatus("pending");
          },
          `/creators/${developerUserId}`,
          { variant: "default" },
        )
      }
      className={`${sizeClass} ${
        status === "rejected"
          ? "border-zinc-700 text-zinc-400 hover:border-zinc-600"
          : compact
            ? "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
            : "border-violet-500/40 bg-violet-600/10 text-violet-200 hover:bg-violet-600/20"
      }`}
    >
      <Users className={iconClass} aria-hidden="true" />
      {status === "rejected" ? "再申請する" : "コミュニティの参加申請"}
    </button>
  );
}
