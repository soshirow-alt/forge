"use client";

import type { ReactNode } from "react";
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
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300"
      aria-hidden
    >
      {initial}
    </span>
  );
}

function PlayerCardShell({
  displayName,
  handle,
  avatarUrl,
  children,
}: {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-3">
      <PlayerAvatar displayName={displayName} avatarUrl={avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="truncate text-sm font-medium text-zinc-100">{displayName}</span>
          {handle ? <XLinkedHandleBadge username={handle} /> : null}
        </div>
        <div className="mt-1.5 space-y-0.5 text-xs leading-relaxed text-zinc-500">{children}</div>
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

function WatchersSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>見届けているプレイヤー</SectionTitle>
      {data.watchers.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {data.watchers.map((person: ProjectSpecialThanksWatcher, index) => (
            <PlayerCardShell
              key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.watchedAt}-${index}`}
              displayName={person.displayName}
              handle={person.handle}
              avatarUrl={person.avatarUrl}
            >
              <p>{formatDateJa(person.watchedAt)} から見届け中</p>
            </PlayerCardShell>
          ))}
        </ul>
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
        <ul className="mt-3 space-y-2.5">
          {data.witnesses.map((person: ProjectSpecialThanksWitness, index) => (
            <PlayerCardShell
              key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.grantedAt}-${index}`}
              displayName={person.displayName}
              handle={person.handle}
              avatarUrl={person.avatarUrl}
            >
              <p>正式版公開まで見届け</p>
              <p>{formatDateJa(person.grantedAt)}</p>
            </PlayerCardShell>
          ))}
        </ul>
      ) : (
        <EmptyLine>まだ表示できるプレイヤーがいません。</EmptyLine>
      )}
    </section>
  );
}

function UpdateContributorsSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>アップデートに貢献したプレイヤー</SectionTitle>
      {data.updateContributors.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {data.updateContributors.map(
            (person: ProjectSpecialThanksUpdateContributor, index) => (
              <PlayerCardShell
                key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.latestAdoptedAt}-${index}`}
                displayName={person.displayName}
                handle={person.handle}
                avatarUrl={person.avatarUrl}
              >
                <p>採用フィードバック {person.adoptedFeedbackCount}件</p>
                {person.latestPublishedVersion ? (
                  <p>最新反映 ver {person.latestPublishedVersion}</p>
                ) : null}
                {person.latestUpdateSummary ? <p>{person.latestUpdateSummary}</p> : null}
              </PlayerCardShell>
            ),
          )}
        </ul>
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
        <ul className="mt-3 space-y-2.5">
          {data.earlyPlayers.map((person: ProjectSpecialThanksEarlyPlayer, index) => (
            <PlayerCardShell
              key={`${person.displayName}-${person.handle ?? "no-handle"}-${person.firstContributedAt}-${index}`}
              displayName={person.displayName}
              handle={person.handle}
              avatarUrl={person.avatarUrl}
            >
              <p>{formatDateJa(person.firstContributedAt)} に初回フィードバック</p>
              {person.firstVersionKey ? <p>ver {person.firstVersionKey}</p> : null}
            </PlayerCardShell>
          ))}
        </ul>
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
    <div className="space-y-8 py-6">
      <div>
        <h2 className="text-base font-semibold text-white">Special Thanks</h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          この作品の更新や改善に関わったプレイヤーです。
        </p>
      </div>

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
