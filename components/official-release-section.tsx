"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CreatorLink } from "@/components/creator-link";
import { PlayTypeLabel } from "@/components/play-type-label";
import {
  usePlayerOfficialReleases,
  type PlayerOfficialReleaseItem,
} from "@/hooks/use-player-official-releases";
import { usePlayerWitnessGrants } from "@/hooks/use-player-witness-grants";
import {
  WITNESS_GRANT_PATH_PLAYER_LABELS,
  WITNESS_PLAYER_EXPLANATION,
  WITNESS_PLAYER_HEADLINE,
} from "@/lib/witness-grants-display";
import { RELEASE_STATUS_LABELS } from "@/lib/project-release-state";
import { formatPlayHistoryDate } from "@/lib/player-play-timeline";
import type { ProjectWitnessGrant } from "@/lib/supabase/witness-grants-db";
import { resolveWitnessTier } from "@/lib/witness-tier";

function WitnessGrantDetails({ grant }: { grant: ProjectWitnessGrant }) {
  return (
    <dl className="mt-3 grid gap-1 text-xs text-zinc-500">
      <div className="flex gap-2">
        <dt className="shrink-0 text-zinc-600">初回 Released</dt>
        <dd>{formatPlayHistoryDate(grant.firstReleasedAt)}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="shrink-0 text-zinc-600">関わり方</dt>
        <dd>{WITNESS_GRANT_PATH_PLAYER_LABELS[grant.grantPath]}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="shrink-0 text-zinc-600">付与日</dt>
        <dd>{formatPlayHistoryDate(grant.grantedAt)}</dd>
      </div>
    </dl>
  );
}

function WitnessReleaseCard({
  release,
  grant,
}: {
  release: PlayerOfficialReleaseItem;
  grant: ProjectWitnessGrant;
}) {
  return (
    <li className="rounded-lg border border-teal-500/25 bg-teal-500/5 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-teal-200/90">{WITNESS_PLAYER_HEADLINE}</p>
          <Link
            href={`/games/${release.projectId}`}
            className="mt-1 block text-sm font-medium text-zinc-100 transition-colors hover:text-orange-400"
          >
            {release.game.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <CreatorLink name={release.game.creator} />
            <PlayTypeLabel playUrl={release.game.playUrl} />
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-0.5 text-xs text-teal-100">
          見届け人
        </span>
      </div>

      <WitnessGrantDetails grant={grant} />

      <Link
        href="/mypage#play-history"
        className="mt-3 inline-flex text-xs font-medium text-orange-400/90 transition-colors hover:text-orange-300"
      >
        プレイ履歴で詳細を見る →
      </Link>
    </li>
  );
}

function OfficialReleaseOnlyCard({ release }: { release: PlayerOfficialReleaseItem }) {
  return (
    <li className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/games/${release.projectId}`}
            className="text-sm font-medium text-zinc-100 transition-colors hover:text-orange-400"
          >
            {release.game.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <CreatorLink name={release.game.creator} />
            <PlayTypeLabel playUrl={release.game.playUrl} />
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-200">
          {RELEASE_STATUS_LABELS[release.currentStatus]}
        </span>
      </div>

      <dl className="mt-3 grid gap-1 text-xs text-zinc-500">
        {release.firstReleasedLabel ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-zinc-600">初回 Released</dt>
            <dd>{release.firstReleasedLabel}</dd>
          </div>
        ) : null}
        <div className="flex gap-2">
          <dt className="shrink-0 text-zinc-600">履歴</dt>
          <dd>{release.eventCount} イベント（再調整しても消えません）</dd>
        </div>
      </dl>

      <Link
        href="/mypage#play-history"
        className="mt-3 inline-flex text-xs font-medium text-orange-400/90 transition-colors hover:text-orange-300"
      >
        プレイ履歴で詳細を見る →
      </Link>
    </li>
  );
}

export function OfficialReleaseSection() {
  const { items: releaseItems } = usePlayerOfficialReleases();
  const {
    grants,
    grantByProjectId,
    items: witnessItems,
    loaded: witnessLoaded,
    error: witnessError,
  } = usePlayerWitnessGrants();

  const witnessTier = useMemo(
    () => resolveWitnessTier(grants.length),
    [grants.length],
  );

  const { witnessReleases, otherReleases } = useMemo(() => {
    const witnessReleases: Array<{
      release: PlayerOfficialReleaseItem;
      grant: ProjectWitnessGrant;
    }> = [];
    const otherReleases: PlayerOfficialReleaseItem[] = [];

    for (const release of releaseItems) {
      const grant = grantByProjectId.get(release.projectId);
      if (grant) {
        witnessReleases.push({ release, grant });
      } else {
        otherReleases.push(release);
      }
    }

    witnessReleases.sort(
      (left, right) =>
        new Date(right.grant.grantedAt).getTime() -
        new Date(left.grant.grantedAt).getTime(),
    );

    return { witnessReleases, otherReleases };
  }, [grantByProjectId, releaseItems]);

  const hasWitness = witnessItems.length > 0;
  const hasAnyRelease = releaseItems.length > 0;
  const showEmpty = witnessLoaded && !hasAnyRelease && !hasWitness;

  return (
    <section
      id="official-release"
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 scroll-mt-24"
    >
      <div className="border-l-2 border-emerald-500 pl-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-100">
          正式版に到達した作品
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          あなたがプレイした作品のうち、開発者が正式版（Released）を宣言したものです。
          {hasWitness
            ? " 見届け人として関わった作品には、正式版までの証拠が表示されます。"
            : null}
        </p>
        {witnessTier && witnessLoaded ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-teal-500/35 bg-teal-500/10 px-2.5 py-0.5 text-xs font-medium text-teal-100">
              {witnessTier.label}
            </span>
            <p className="text-xs leading-relaxed text-zinc-500">{witnessTier.summary}</p>
          </div>
        ) : null}
      </div>

      {!witnessLoaded ? (
        <p className="mt-4 text-sm text-zinc-600">読み込み中…</p>
      ) : null}

      {witnessError ? (
        <p className="mt-4 text-sm text-red-400/90">{witnessError}</p>
      ) : null}

      {hasWitness && witnessLoaded ? (
        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          {WITNESS_PLAYER_EXPLANATION}
        </p>
      ) : null}

      {showEmpty ? (
        <p className="mt-4 text-sm text-zinc-600">
          まだ正式版に到達したプレイ作品がありません。
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {witnessReleases.map(({ release, grant }) => (
            <WitnessReleaseCard
              key={`witness-${release.projectId}`}
              release={release}
              grant={grant}
            />
          ))}
          {otherReleases.map((release) => (
            <OfficialReleaseOnlyCard key={release.projectId} release={release} />
          ))}
        </ul>
      )}
    </section>
  );
}
