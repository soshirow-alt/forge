"use client";

import { useState, type ReactNode } from "react";
import { XLinkedHandleBadge } from "@/components/x-linked-handle-badge";
import { useProjectSpecialThanks } from "@/hooks/use-project-special-thanks";
import {
  isReleasedForPlayerDisplay,
  isReleaseReopenedForPlayerDisplay,
} from "@/lib/game-player-display";
import type {
  ProjectSpecialThanks,
  ProjectSpecialThanksEarlyPlayer,
  ProjectSpecialThanksUpdateContributor,
  ProjectSpecialThanksWatcher,
  ProjectSpecialThanksWitness,
} from "@/lib/supabase/project-special-thanks-db";

type GameSpecialThanksTabProps = {
  projectId: string | undefined;
};

const SECTION_PREVIEW_LIMIT = 6;

function formatDateJa(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function PlayerAvatar({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const src = avatarUrl?.trim();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external X/meta avatars; no next.config remotePatterns
      <img
        src={src}
        alt=""
        className="size-10 shrink-0 rounded-full bg-zinc-800 object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  const initial = displayName.slice(0, 1) || "?";
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300"
      aria-hidden
    >
      {initial}
    </span>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-700/80 bg-zinc-900/80 px-2 py-0.5 text-xs font-medium text-zinc-300">
      {children}
    </span>
  );
}

function RoleChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-100">
      {children}
    </span>
  );
}

function PlayerCard({
  displayName,
  handle,
  avatarUrl,
  chips,
  footer,
}: {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  chips: ReactNode;
  footer?: string | null;
}) {
  return (
    <li className="rounded-xl border border-zinc-800/80 bg-zinc-950/35 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <PlayerAvatar displayName={displayName} avatarUrl={avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-[15px] font-semibold leading-snug text-zinc-50">
                  {displayName}
                </span>
                {handle ? <XLinkedHandleBadge username={handle} /> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">{chips}</div>
          </div>
          {footer ? (
            <p className="mt-2 truncate text-sm leading-snug text-zinc-400">{footer}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold text-zinc-200">{children}</h3>;
}

function EmptyLine({ children }: { children: string }) {
  return <p className="mt-3 text-sm text-zinc-600">{children}</p>;
}

function ExpandablePlayerGrid({
  totalCount,
  children,
}: {
  totalCount: number;
  children: (visibleCount: number) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, totalCount - SECTION_PREVIEW_LIMIT);
  const visibleCount =
    expanded || hiddenCount === 0 ? totalCount : SECTION_PREVIEW_LIMIT;

  return (
    <div className="mt-3">
      <ul className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2">{children(visibleCount)}</ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 text-sm font-medium text-zinc-300 underline-offset-4 hover:text-white hover:underline"
        >
          {expanded ? "閉じる" : `ほか${hiddenCount}人を見る`}
        </button>
      ) : null}
    </div>
  );
}

function WatchersSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>見届けているプレイヤー</SectionTitle>
      {data.watchers.length > 0 ? (
        <ExpandablePlayerGrid totalCount={data.watchers.length}>
          {(visibleCount) =>
            data.watchers.slice(0, visibleCount).map((person: ProjectSpecialThanksWatcher, index) => (
              <PlayerCard
                key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.watchedAt}-${index}`}
                displayName={person.displayName}
                handle={person.handle}
                avatarUrl={person.avatarUrl}
                chips={<MetaChip>{formatDateJa(person.watchedAt)}〜</MetaChip>}
              />
            ))
          }
        </ExpandablePlayerGrid>
      ) : (
        <EmptyLine>まだ表示できるプレイヤーがいません。</EmptyLine>
      )}
    </section>
  );
}

function WitnessSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>最後まで見届けたプレイヤー</SectionTitle>
      {data.witnesses.length > 0 ? (
        <ExpandablePlayerGrid totalCount={data.witnesses.length}>
          {(visibleCount) =>
            data.witnesses.slice(0, visibleCount).map((person: ProjectSpecialThanksWitness, index) => (
              <PlayerCard
                key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.grantedAt}-${index}`}
                displayName={person.displayName}
                handle={person.handle}
                avatarUrl={person.avatarUrl}
                chips={
                  <>
                    <RoleChip>正式版まで見届け</RoleChip>
                    <MetaChip>{formatDateJa(person.grantedAt)}</MetaChip>
                  </>
                }
              />
            ))
          }
        </ExpandablePlayerGrid>
      ) : (
        <EmptyLine>まだ表示できるプレイヤーがいません。</EmptyLine>
      )}
    </section>
  );
}

function UpdateContributorsSection({ data }: { data: ProjectSpecialThanks }) {
  // 1人1カード（RPC集約済み）。表示順: 参考FB件数 desc → 最新評価日時 desc
  const contributors = [...data.updateContributors].sort((a, b) => {
    if (b.adoptedFeedbackCount !== a.adoptedFeedbackCount) {
      return b.adoptedFeedbackCount - a.adoptedFeedbackCount;
    }
    return (
      new Date(b.latestAdoptedAt).getTime() - new Date(a.latestAdoptedAt).getTime()
    );
  });

  return (
    <section>
      <SectionTitle>アップデートに貢献したプレイヤー</SectionTitle>
      {contributors.length > 0 ? (
        <ExpandablePlayerGrid totalCount={contributors.length}>
          {(visibleCount) =>
            contributors.slice(0, visibleCount).map((person: ProjectSpecialThanksUpdateContributor, index) => (
              <PlayerCard
                key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.latestAdoptedAt}-${index}`}
                displayName={person.displayName}
                handle={person.handle}
                avatarUrl={person.avatarUrl}
                chips={
                  <>
                    <RoleChip>参考FB {person.adoptedFeedbackCount}件</RoleChip>
                    {person.latestPublishedVersion ? (
                      <MetaChip>ver {person.latestPublishedVersion}</MetaChip>
                    ) : null}
                  </>
                }
              />
            ))
          }
        </ExpandablePlayerGrid>
      ) : (
        <EmptyLine>まだ表示できるプレイヤーがいません。</EmptyLine>
      )}
    </section>
  );
}

function EarlyPlayersSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>初期にフィードバックしたプレイヤー</SectionTitle>
      {data.earlyPlayers.length > 0 ? (
        <ExpandablePlayerGrid totalCount={data.earlyPlayers.length}>
          {(visibleCount) =>
            data.earlyPlayers
              .slice(0, visibleCount)
              .map((person: ProjectSpecialThanksEarlyPlayer, index) => (
                <PlayerCard
                  key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.firstContributedAt}-${index}`}
                  displayName={person.displayName}
                  handle={person.handle}
                  avatarUrl={person.avatarUrl}
                  chips={
                    <>
                      {person.firstVersionKey ? (
                        <MetaChip>ver {person.firstVersionKey}</MetaChip>
                      ) : null}
                      <MetaChip>{formatDateJa(person.firstContributedAt)}</MetaChip>
                    </>
                  }
                />
              ))
          }
        </ExpandablePlayerGrid>
      ) : (
        <EmptyLine>まだ表示できるプレイヤーがいません。</EmptyLine>
      )}
    </section>
  );
}

export function GameSpecialThanksTab({ projectId }: GameSpecialThanksTabProps) {
  const { data, loaded, error } = useProjectSpecialThanks(projectId);

  if (!projectId) {
    return (
      <div className="py-6">
        <EmptyLine>この作品では Special Thanks を表示できません。</EmptyLine>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="py-6">
        <p className="text-sm text-zinc-500">読み込み中…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  const showWitnesses =
    isReleasedForPlayerDisplay(data.releaseStatus ?? undefined) ||
    isReleaseReopenedForPlayerDisplay(data.releaseStatus ?? undefined);
  const showWatchers = !showWitnesses;

  const hasAnyContent =
    (showWatchers && data.watchers.length > 0) ||
    (showWitnesses && data.witnesses.length > 0) ||
    data.updateContributors.length > 0 ||
    data.earlyPlayers.length > 0;

  return (
    <div className="w-full space-y-8 py-6">
      <h2 className="text-base font-semibold text-white">Special Thanks</h2>

      {!hasAnyContent ? (
        <EmptyLine>まだ Special Thanks に載せる記録がありません。</EmptyLine>
      ) : null}

      {showWatchers ? <WatchersSection data={data} /> : null}
      {showWitnesses ? <WitnessSection data={data} /> : null}
      <UpdateContributorsSection data={data} />
      <EarlyPlayersSection data={data} />
    </div>
  );
}
