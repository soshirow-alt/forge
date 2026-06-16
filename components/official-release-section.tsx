"use client";

import { useMemo, useState } from "react";
import {
  ForgeGameCard,
  type ForgeGameCardBadge,
} from "@/components/forge-game-card";
import {
  usePlayerOfficialReleases,
  type PlayerOfficialReleaseItem,
} from "@/hooks/use-player-official-releases";
import { usePlayerWitnessGrants } from "@/hooks/use-player-witness-grants";
import { resolveWitnessTier } from "@/lib/witness-tier";

function buildReleaseBadges(
  release: PlayerOfficialReleaseItem,
  hasWitnessGrant: boolean,
): ForgeGameCardBadge[] {
  const badges: ForgeGameCardBadge[] = [];

  if (hasWitnessGrant) {
    badges.push({ id: "witness", emoji: "🏅", label: "見届け人" });
  }

  badges.push({ id: "official", label: "正式版" });

  return badges;
}

export function OfficialReleaseSection() {
  const { items: releaseItems } = usePlayerOfficialReleases();
  const { grants, grantByProjectId, loaded: witnessLoaded, error: witnessError } =
    usePlayerWitnessGrants();
  const [expanded, setExpanded] = useState(false);

  const witnessTier = useMemo(
    () => resolveWitnessTier(grants.length),
    [grants.length],
  );

  const hasAnyRelease = releaseItems.length > 0;
  const showEmpty = witnessLoaded && !hasAnyRelease;

  return (
    <section
      id="official-release"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
    >
      <div className="border-l-2 border-emerald-500 pl-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-100">
              正式版に到達した作品
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              プレイした作品のうち、正式版（Released）に到達したものです。
            </p>
          </div>
          {witnessTier && witnessLoaded ? (
            <span className="rounded-full border border-teal-500/35 bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-100">
              {witnessTier.label}
            </span>
          ) : null}
        </div>
      </div>

      {!witnessLoaded ? (
        <p className="mt-4 text-sm text-zinc-600">読み込み中…</p>
      ) : null}

      {witnessError ? (
        <p className="mt-4 text-sm text-red-400/90">{witnessError}</p>
      ) : null}

      {showEmpty ? (
        <p className="mt-4 text-sm text-zinc-600">
          まだ正式版に到達したプレイ作品がありません。
        </p>
      ) : hasAnyRelease ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/30 px-4 py-2.5 text-left text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900/40"
            aria-expanded={expanded}
          >
            <span>{releaseItems.length} 作品</span>
            <span aria-hidden="true" className="text-zinc-600">
              {expanded ? "▼" : "▶"}
            </span>
          </button>

          {expanded ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {releaseItems.map((release) => {
                const hasWitnessGrant = grantByProjectId.has(release.projectId);

                return (
                  <li key={release.projectId}>
                    <ForgeGameCard
                      game={release.game}
                      variant="grid"
                      badges={buildReleaseBadges(release, hasWitnessGrant)}
                      meta={
                        release.firstReleasedLabel
                          ? `正式版 ${release.firstReleasedLabel}`
                          : undefined
                      }
                      detailLabel="詳細 →"
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
