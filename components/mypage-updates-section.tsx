"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useGames } from "@/components/games-provider";
import { ForgeGameCard } from "@/components/forge-game-card";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { fetchConfirmationRequestsByDevlogIds } from "@/lib/supabase/confirmation-requests-db";
import {
  buildPlayerUpdates,
  formatNotificationDate,
  type PlayerUpdateItem,
} from "@/lib/mypage-updates-builder";
import { sortDevlogsNewestFirst } from "@/lib/devlogs";
import type { Game } from "@/lib/mock-games";

function badgeClassName(update: PlayerUpdateItem): string {
  if (update.hasConfirmationRequest) {
    return "rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-300";
  }

  return update.isVersionPublish
    ? "rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-medium text-orange-400"
    : "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400";
}

export function MyPageUpdatesSection({
  watchedGames,
  playedGames = [],
  previewLimit,
}: {
  watchedGames: Game[];
  playedGames?: Game[];
  previewLimit?: number;
}) {
  const { getNotifications, getDevlogsByProject } = useGames();
  const [confirmationsLoaded, setConfirmationsLoaded] = useState(false);
  const [confirmationsByDevlogId, setConfirmationsByDevlogId] = useState(
    () => new Map(),
  );

  const devlogIds = useMemo(() => {
    const ids = new Set<string>();
    const games = [...watchedGames, ...playedGames];
    for (const game of games) {
      const latest = sortDevlogsNewestFirst(getDevlogsByProject(game.id))[0];
      if (latest?.id) {
        ids.add(latest.id);
      }
    }
    for (const notification of getNotifications()) {
      if (
        notification.type !== "devlog" &&
        notification.type !== "version_published" &&
        notification.type !== "confirmation_request"
      ) {
        continue;
      }
      const latest = sortDevlogsNewestFirst(
        getDevlogsByProject(notification.projectId),
      )[0];
      if (latest?.id) {
        ids.add(latest.id);
      }
    }
    return [...ids];
  }, [watchedGames, playedGames, getDevlogsByProject, getNotifications]);

  useEffect(() => {
    let cancelled = false;
    setConfirmationsLoaded(false);

    const supabase = getOptionalSupabaseClient();
    if (!supabase || devlogIds.length === 0) {
      setConfirmationsByDevlogId(new Map());
      setConfirmationsLoaded(true);
      return;
    }

    void fetchConfirmationRequestsByDevlogIds(supabase, devlogIds).then((records) => {
      if (cancelled) {
        return;
      }

      const map = new Map();
      for (const [devlogId, record] of records.entries()) {
        map.set(devlogId, {
          changesSummary: record.changesSummary,
          askSummary: record.askSummary,
          estimatedDuration: record.estimatedDuration,
          linkedPriorities: record.linkedPriorities,
          notifyAudience: record.notifyAudience,
          notifyEnabled: record.notifyEnabled,
        });
      }
      setConfirmationsByDevlogId(map);
      setConfirmationsLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [devlogIds]);

  const updates = useMemo(
    () =>
      buildPlayerUpdates({
        watchedGames,
        playedGames,
        notifications: getNotifications(),
        getDevlogsByProject,
        confirmationsByDevlogId,
      }),
    [
      watchedGames,
      playedGames,
      getNotifications,
      getDevlogsByProject,
      confirmationsByDevlogId,
    ],
  );

  const displayUpdates = previewLimit
    ? updates.slice(0, previewLimit)
    : updates.slice(0, 8);

  const hasSourceGames = watchedGames.length > 0 || playedGames.length > 0;

  return (
    <section id="updates" className="scroll-mt-24">
      <div
        className={
          previewLimit
            ? "border-l-2 border-emerald-500 pl-3"
            : "border-l-2 border-emerald-500 pl-4"
        }
      >
        <h2
          className={
            previewLimit
              ? "text-base font-semibold tracking-tight text-zinc-100"
              : "text-xl font-semibold tracking-tight text-zinc-100"
          }
        >
          前回プレイ後の更新
        </h2>
        <p
          className={
            previewLimit
              ? "mt-1 text-xs leading-relaxed text-zinc-500"
              : "mt-1 text-sm text-zinc-500"
          }
        >
          プレイした作品の更新と、確認依頼があればここに表示されます。
        </p>
      </div>

      {!confirmationsLoaded ? (
        <p className="mt-5 text-sm text-zinc-600">更新を読み込み中...</p>
      ) : !hasSourceGames ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center">
          <p className="text-sm text-zinc-500">
            プレイまたは追跡中の作品がないため、更新は表示されません。
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            作品をプレイするか、詳細から「更新を追う」を押すとここに表示されます。
          </p>
        </div>
      ) : updates.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-5 py-10 text-center">
          <p className="text-sm text-zinc-500">
            まだ表示できる更新がありません。
          </p>
          <Link
            href="/notifications"
            className="mt-3 inline-block cursor-pointer text-sm font-medium text-orange-400 transition-colors hover:text-orange-300"
          >
            通知一覧を見る →
          </Link>
        </div>
      ) : (
        <ul className={previewLimit ? "mt-4 space-y-2" : "mt-5 space-y-3"}>
          {displayUpdates.map((update) => (
            <li key={update.id}>
              <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={badgeClassName(update)}>{update.badgeLabel}</span>
                  <time dateTime={update.date} className="text-xs text-zinc-600">
                    {formatNotificationDate(update.date)}
                  </time>
                </div>
                <p className="mt-2 text-base font-semibold text-zinc-100">
                  {update.headline}
                </p>
                <div className="mt-3">
                  <ForgeGameCard
                    game={update.game}
                    variant="row"
                    badges={[
                      {
                        id: update.hasConfirmationRequest ? "confirmation" : "update",
                        emoji: update.hasConfirmationRequest ? "📌" : "🔄",
                        label: update.hasConfirmationRequest ? "確認依頼" : "更新",
                      },
                    ]}
                    primaryAction={{
                      label: update.hasConfirmationRequest
                        ? "変化を確認する"
                        : "もう一度プレイする",
                      href: update.replayHref,
                    }}
                    detailHref={update.detailsHref}
                    detailLabel={
                      update.hasConfirmationRequest
                        ? "確認ポイントを見る →"
                        : "更新内容を見る →"
                    }
                    className="border-zinc-800/60"
                  />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {confirmationsLoaded && updates.length > 0 && (
        <p className={previewLimit ? "mt-3 text-xs text-zinc-600" : "mt-4 text-xs text-zinc-600"}>
          {previewLimit && updates.length > (previewLimit ?? 0) && (
            <>
              <Link
                href="/notifications"
                className="cursor-pointer text-orange-400/90 hover:text-orange-300"
              >
                通知一覧
              </Link>
              で全件確認 ·{" "}
            </>
          )}
          {!previewLimit && (
            <>
              すべての通知は
              <Link
                href="/notifications"
                className="mx-1 cursor-pointer text-orange-400/90 hover:text-orange-300"
              >
                通知一覧
              </Link>
              からも確認できます。
            </>
          )}
        </p>
      )}
    </section>
  );
}
