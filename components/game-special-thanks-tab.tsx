"use client";

import { XLinkedHandleBadge } from "@/components/x-linked-handle-badge";
import { useProjectSpecialThanks } from "@/hooks/use-project-special-thanks";
import {
  isReleasedForPlayerDisplay,
  isReleaseReopenedForPlayerDisplay,
} from "@/lib/game-player-display";
import type { ProjectSpecialThanks } from "@/lib/supabase/project-special-thanks-db";

type GameSpecialThanksTabProps = {
  projectId: string | undefined;
};

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold text-zinc-200">{children}</h3>;
}

function SectionHint({ children }: { children: string }) {
  return <p className="mt-1 text-xs leading-relaxed text-zinc-500">{children}</p>;
}

function EmptyLine({ children }: { children: string }) {
  return <p className="mt-3 text-sm text-zinc-600">{children}</p>;
}

function NameList({
  people,
}: {
  people: { displayName: string; handle: string | null }[];
}) {
  return (
    <ul className="mt-3 space-y-2">
      {people.map((person, index) => (
        <li
          key={`${person.displayName}-${person.handle ?? "no-handle"}-${index}`}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
        >
          <span className="text-sm font-medium text-zinc-200">{person.displayName}</span>
          {person.handle ? <XLinkedHandleBadge username={person.handle} /> : null}
        </li>
      ))}
    </ul>
  );
}

function WatchCountSection({ watchCount }: { watchCount: number }) {
  return (
    <section>
      <SectionTitle>見届けているプレイヤー</SectionTitle>
      <SectionHint>正式版前からこの作品を見届けている人数です。個人名は公開しません。</SectionHint>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
        {watchCount.toLocaleString()}
        <span className="ml-1 text-sm font-medium text-zinc-500">人</span>
      </p>
    </section>
  );
}

function WitnessSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>最初から最後まで見届けたプレイヤー</SectionTitle>
      <SectionHint>正式版まで見届けたプレイヤーです。</SectionHint>
      {data.witnesses.length > 0 ? (
        <NameList people={data.witnesses} />
      ) : (
        <EmptyLine>まだ表示できる見届け記録がありません。</EmptyLine>
      )}
    </section>
  );
}

function AdoptionsSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>更新の参考になったフィードバック</SectionTitle>
      <SectionHint>開発ログの更新に結びついたプレイヤーの声です。</SectionHint>
      {data.adoptions.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {data.adoptions.map((item, index) => (
            <li
              key={`${item.displayName}-${item.publishedVersion}-${index}`}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-medium text-zinc-200">{item.displayName}</span>
                {item.handle ? <XLinkedHandleBadge username={item.handle} /> : null}
                <span className="text-xs text-zinc-600">ver {item.publishedVersion}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                「{item.playerQuote}」
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                {item.updateSummary}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyLine>まだ公開できる採用フィードバックがありません。</EmptyLine>
      )}
    </section>
  );
}

function EarlyPlayersSection({ data }: { data: ProjectSpecialThanks }) {
  return (
    <section>
      <SectionTitle>早期に見つけたプレイヤー</SectionTitle>
      <SectionHint>初声または詳しい感想を早く残した登録プレイヤーです。</SectionHint>
      {data.earlyPlayers.length > 0 ? (
        <NameList people={data.earlyPlayers} />
      ) : (
        <EmptyLine>まだ表示できる早期プレイヤーがいません。</EmptyLine>
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
  const showWatchCount = !showWitnesses;

  const hasAnyContent =
    (showWatchCount && data.watchCount > 0) ||
    (showWitnesses && data.witnesses.length > 0) ||
    data.adoptions.length > 0 ||
    data.earlyPlayers.length > 0;

  return (
    <div className="space-y-8 py-6">
      <div>
        <h2 className="text-base font-semibold text-white">Special Thanks</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          この作品に関わってくれたプレイヤーへの謝辞です。
        </p>
      </div>

      {!hasAnyContent ? (
        <EmptyLine>まだ Special Thanks に載せる記録がありません。</EmptyLine>
      ) : null}

      {showWatchCount ? <WatchCountSection watchCount={data.watchCount} /> : null}
      {showWitnesses ? <WitnessSection data={data} /> : null}
      <AdoptionsSection data={data} />
      <EarlyPlayersSection data={data} />
    </div>
  );
}
