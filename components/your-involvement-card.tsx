"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import {
  formatInvolvementDate,
  type PlayerProjectInvolvement,
} from "@/lib/player-project-involvement";
import { LOGIN_PATH } from "@/lib/login-return-url";
import { formatPlayableVersionLabel } from "@/lib/playable-version";
import { WATCH_BADGE_LABEL } from "@/lib/watch-ui-labels";

type YourInvolvementCardProps = {
  hydrated: boolean;
  isLoggedIn: boolean;
  loginHref: string;
  involvement: PlayerProjectInvolvement | null;
  loaded: boolean;
  watching: boolean;
  playableVersion?: string | null;
  onPlayLatest: () => void;
  playDisabled?: boolean;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-right text-zinc-200">{value}</dd>
    </div>
  );
}

function voiceFeedbackLabel(involvement: PlayerProjectInvolvement): string {
  const parts: string[] = [];
  if (involvement.voiceVersionCount > 0) {
    parts.push(`初声 ${involvement.voiceVersionCount}版`);
  }
  if (involvement.deepFeedbackCount > 0) {
    parts.push(`FB ${involvement.deepFeedbackCount}件`);
  }
  if (parts.length === 0) {
    return "0";
  }
  return parts.join(" / ");
}

function latestPlayLabel(
  involvement: PlayerProjectInvolvement,
  playableVersion?: string | null,
): string {
  const versionLabel = playableVersion?.trim()
    ? formatPlayableVersionLabel(playableVersion)
    : null;
  if (involvement.hasPlayedLatestVersion === true) {
    return versionLabel ? `${versionLabel} プレイ済み` : "プレイ済み";
  }
  if (involvement.hasPlayedLatestVersion === false) {
    return versionLabel ? `${versionLabel} は未プレイ` : "未プレイ";
  }
  return "—";
}

export function YourInvolvementCard({
  hydrated,
  isLoggedIn,
  loginHref,
  involvement,
  loaded,
  watching,
  playableVersion,
  onPlayLatest,
  playDisabled = false,
}: YourInvolvementCardProps) {
  if (!hydrated) {
    return (
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-white">あなたとの関わり</h2>
        <p className="mt-3 text-sm text-zinc-500">読み込み中...</p>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-white">あなたとの関わり</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          ログインすると、この作品との関わりが残ります。
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          プレイ履歴や送ったフィードバックをあとから見られます。
        </p>
        <Link
          href={loginHref.startsWith(LOGIN_PATH) ? loginHref : LOGIN_PATH}
          className="mt-4 inline-flex text-xs text-violet-400 transition-colors hover:text-violet-300"
        >
          ログインする
        </Link>
      </section>
    );
  }

  if (!loaded) {
    return (
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-white">あなたとの関わり</h2>
        <p className="mt-3 text-sm text-zinc-500">読み込み中...</p>
      </section>
    );
  }

  const hasInvolvement = Boolean(involvement?.hasAnyInvolvement);
  const showPlayLatestCta = involvement?.hasPlayedLatestVersion === false;

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <h2 className="text-sm font-semibold text-white">あなたとの関わり</h2>

      {!hasInvolvement || !involvement ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          まだこの作品との関わりはありません。プレイやフィードバックを送ると、ここに残ります。
        </p>
      ) : (
        <dl className="mt-4 space-y-2.5">
          <Row
            label="初回プレイ"
            value={
              involvement.firstPlayedAt
                ? formatInvolvementDate(involvement.firstPlayedAt)
                : "—"
            }
          />
          <Row
            label="初めて遊んだ版"
            value={
              involvement.firstPlayedVersion
                ? formatPlayableVersionLabel(involvement.firstPlayedVersion)
                : "—"
            }
          />
          <Row label="プレイ回数" value={`${involvement.playCount}回`} />
          <Row label="再プレイ" value={`${involvement.replayCount}回`} />
          <Row label="送ったフィードバック" value={voiceFeedbackLabel(involvement)} />
          {involvement.lastVoiceVersion ? (
            <Row
              label="最後にフィードバックした版"
              value={formatPlayableVersionLabel(involvement.lastVoiceVersion)}
            />
          ) : null}
          <Row
            label="更新追跡"
            value={watching ? WATCH_BADGE_LABEL : "していない"}
          />
          <Row
            label="最新版"
            value={latestPlayLabel(involvement, playableVersion)}
          />
        </dl>
      )}

      {showPlayLatestCta ? (
        <button
          type="button"
          onClick={onPlayLatest}
          disabled={playDisabled}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play className="size-4" aria-hidden="true" />
          最新版をプレイする
        </button>
      ) : null}
    </section>
  );
}
