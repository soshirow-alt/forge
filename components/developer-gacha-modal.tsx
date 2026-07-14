"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { developerProfileHref, type DeveloperSearchResult } from "@/lib/developer-search-v0-mock-data";
import { BadgeCheck, Sparkles, X } from "lucide-react";

type DeveloperGachaModalProps = {
  open: boolean;
  developer: DeveloperSearchResult | null;
  onClose: () => void;
};

type GachaPhase = "rolling" | "opening" | "reveal";

export function DeveloperGachaModal({
  open,
  developer,
  onClose,
}: DeveloperGachaModalProps) {
  const [phase, setPhase] = useState<GachaPhase>("rolling");

  useEffect(() => {
    if (!open || !developer) {
      return;
    }

    setPhase("rolling");
    const openingTimer = window.setTimeout(() => setPhase("opening"), 900);
    const revealTimer = window.setTimeout(() => setPhase("reveal"), 1500);

    return () => {
      window.clearTimeout(openingTimer);
      window.clearTimeout(revealTimer);
    };
  }, [open, developer]);

  if (!open || !developer) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-gacha-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="閉じる"
        >
          <X className="size-5" />
        </button>

        {phase !== "reveal" ? (
          <div className="flex flex-col items-center py-8">
            <p className="text-sm font-medium text-violet-300">開発者ガチャ</p>
            <div
              className={`relative mt-8 flex size-32 items-center justify-center rounded-3xl border-2 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 ${
                phase === "rolling"
                  ? "animate-[gacha-shake_0.45s_ease-in-out_infinite] border-violet-400/60"
                  : "scale-110 border-fuchsia-300/80 shadow-[0_0_40px_rgba(192,132,252,0.45)]"
              }`}
            >
              <Sparkles
                className={`size-12 text-violet-300 ${phase === "opening" ? "animate-pulse" : ""}`}
                aria-hidden="true"
              />
            </div>
            <p className="mt-6 text-sm text-zinc-400">
              {phase === "rolling" ? "シャカシャカ…" : "開封中…"}
            </p>
          </div>
        ) : (
          <div className="animate-[gacha-reveal_0.45s_ease-out] pt-2">
            <p
              id="developer-gacha-title"
              className="text-center text-sm font-semibold text-fuchsia-300"
            >
              当たり！
            </p>
            <div className="mt-5 flex flex-col items-center text-center">
              <ProfileAvatar
                src={developer.avatar}
                userId={developer.userId}
                className="size-24 border-2 border-violet-500/40 ring-4 ring-violet-500/20"
                size={96}
              />
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <h2 className="text-xl font-bold text-white">{developer.name}</h2>
                {developer.verified && (
                  <BadgeCheck className="size-5 text-violet-400" aria-label="認証済み" />
                )}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-400">{developer.bio}</p>
              {developer.genres.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {developer.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-zinc-500">
                {developer.followers == null
                  ? "フォロワー …"
                  : `フォロワー ${developer.followers.toLocaleString()}`}
                {" · "}
                公開作品{" "}
                {(
                  developer.publicGameCount ??
                  developer.inDevelopment + developer.completed
                ).toLocaleString()}
              </p>
              <Link
                href={developerProfileHref(developer.id)}
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                プロフィールを見る
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
