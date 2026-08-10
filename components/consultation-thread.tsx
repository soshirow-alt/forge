"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ConsultationContextCard } from "@/components/consultation-context-card";
import { ConsultationStartForm } from "@/components/consultation-start-form";
import { ContentReportButton } from "@/components/content-report-button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useGames } from "@/components/games-provider";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  applyConsultationAckEvent,
  createConsultationAckState,
  type ConsultationAckState,
} from "@/lib/collab/consultation-ack-lifecycle";
import type {
  CollabConsultation,
  CollabConsultationContext,
  CollabConsultationMessage,
} from "@/lib/collab/consultation-types";
import { resolveProjectThumbnailUrls } from "@/lib/project-thumbnails";

function shortUserId(userId: string): string {
  return userId.length > 8 ? `${userId.slice(0, 8)}…` : userId;
}

function MessageBody({ body }: { body: string }) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {parts.map((part, index) =>
        /^https?:\/\//i.test(part) ? (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-violet-200 underline hover:text-violet-100"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function mergeMessages(
  current: CollabConsultationMessage[],
  next: CollabConsultationMessage[],
): CollabConsultationMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  next.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function realtimeConsultationFilter(ids: string[]): string {
  if (ids.length <= 1) {
    return `consultation_id=eq.${ids[0] ?? ""}`;
  }
  return `consultation_id=in.(${ids.join(",")})`;
}

function ThreadAvatar({
  userId,
  name,
  avatarUrl,
  mine,
}: {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  mine?: boolean;
}) {
  if (avatarUrl) {
    return (
      <ProfileAvatar src={avatarUrl} userId={userId} className="size-8" size={32} />
    );
  }
  const initial = name.trim().slice(0, 1) || "?";
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        mine
          ? "bg-violet-500/30 text-violet-200"
          : "bg-zinc-800 text-zinc-300"
      }`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

type ConsultationDetailResponse = {
  consultation: CollabConsultation;
  messages: CollabConsultationMessage[];
  pairConsultationIds?: string[];
  pairContexts?: CollabConsultationContext[];
};

export function ConsultationThread({
  consultationId,
  embedded = false,
}: {
  consultationId: string;
  /** When true (desktop 2-pane), hide outer back chrome. */
  embedded?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startRequested = searchParams.get("start") === "1";
  const startProjectId = searchParams.get("project")?.trim() || null;
  /** "inherit" follows URL; cancel forces off until remount/navigation. */
  const [composeOverride, setComposeOverride] = useState<"inherit" | "off">("inherit");
  const composingStart = composeOverride === "inherit" && startRequested;

  const { user } = useAuth();
  const { getDeveloperProfileByUserId, getGameById } = useGames();
  const [consultation, setConsultation] = useState<CollabConsultation | null>(null);
  const [pairContexts, setPairContexts] = useState<CollabConsultationContext[]>([]);
  const [messages, setMessages] = useState<CollabConsultationMessage[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [ackError, setAckError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  /** Bumped only after detail/message state is scheduled; ack runs in a later effect (post-commit). */
  const [ackToken, setAckToken] = useState(0);
  const ackLifecycleRef = useRef<ConsultationAckState>(createConsultationAckState());

  const markConsultationAcknowledged = useCallback(async (): Promise<void> => {
    const response = await fetch(`/api/collab/consultations/${consultationId}/read`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("既読反映に失敗しました。再試行してください。");
    }
  }, [consultationId]);

  const recordDetailOkAndScheduleAck = useCallback(() => {
    const afterDetail = applyConsultationAckEvent(ackLifecycleRef.current, "detailOk");
    ackLifecycleRef.current = afterDetail.state;
    setAckToken((token) => token + 1);
  }, []);

  const scheduleAckOnlyIfDetailAlreadyOk = useCallback(() => {
    // Realtime must not promote detailOk after a failed authoritative GET.
    if (!ackLifecycleRef.current.detailOk) return;
    const afterRt = applyConsultationAckEvent(ackLifecycleRef.current, "realtimeMessages");
    ackLifecycleRef.current = afterRt.state;
    if (afterRt.state.phase !== "detailReady") return;
    setAckToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (ackToken === 0) return;
    const applied = applyConsultationAckEvent(ackLifecycleRef.current, "uiCommitted");
    ackLifecycleRef.current = applied.state;
    if (!applied.shouldStartAck) return;
    let cancelled = false;
    void markConsultationAcknowledged()
      .then(() => {
        if (cancelled) return;
        ackLifecycleRef.current = applyConsultationAckEvent(
          ackLifecycleRef.current,
          "ackOk",
        ).state;
        setAckError("");
      })
      .catch((cause) => {
        if (cancelled) return;
        ackLifecycleRef.current = applyConsultationAckEvent(
          ackLifecycleRef.current,
          "ackFail",
        ).state;
        setAckError(String(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [ackToken, markConsultationAcknowledged]);

  useEffect(() => {
    let active = true;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let teardownRealtime: (() => void) | undefined;
    const supabase = getOptionalSupabaseClient();
    ackLifecycleRef.current = createConsultationAckState();

    const refresh = () => {
      void Promise.resolve()
        .then(async () => {
          const response = await fetch(`/api/collab/consultations/${consultationId}`, {
            cache: "no-store",
          });
          if (!response.ok) return;
          const result = (await response.json()) as ConsultationDetailResponse;
          if (!active) return;
          setConsultation(result.consultation);
          setPairContexts(result.pairContexts ?? []);
          setMessages((current) => mergeMessages(current, result.messages));
          if (!ackLifecycleRef.current.detailOk) {
            recordDetailOkAndScheduleAck();
          }
        })
        .catch(() => undefined);
    };

    const startPollFallback = () => {
      if (pollTimer || !active) return;
      pollTimer = setInterval(refresh, 8_000);
    };

    void Promise.resolve()
      .then(async () => {
        const response = await fetch(`/api/collab/consultations/${consultationId}`, {
          cache: "no-store",
        });
        if (response.status === 404) {
          if (active) {
            setUnavailable(true);
            router.replace("/messages?notice=unavailable");
          }
          return;
        }
        if (!response.ok) {
          throw new Error("メッセージを読み込めませんでした。");
        }
        const result = (await response.json()) as ConsultationDetailResponse;
        if (!active) return;
        setUnavailable(false);
        setError("");
        setConsultation(result.consultation);
        setPairContexts(result.pairContexts ?? []);
        setMessages(result.messages);
        const ids =
          result.pairConsultationIds?.length ?
            result.pairConsultationIds
          : [consultationId];
        recordDetailOkAndScheduleAck();

        if (!supabase) {
          startPollFallback();
          return;
        }

        const channel = supabase
          .channel(`consultation:${consultationId}:${ids.join(",")}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "collab_consultation_messages",
              filter: realtimeConsultationFilter(ids),
            },
            (payload) => {
              const row = payload.new as {
                id: string;
                consultation_id: string;
                sender_id: string;
                body: string;
                created_at: string;
              };
              setMessages((current) =>
                mergeMessages(current, [
                  {
                    id: row.id,
                    consultationId: row.consultation_id,
                    senderId: row.sender_id,
                    body: row.body,
                    createdAt: row.created_at,
                  },
                ]),
              );
              scheduleAckOnlyIfDetailAlreadyOk();
            },
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              startPollFallback();
            }
          });
        teardownRealtime = () => {
          void supabase.removeChannel(channel);
        };
      })
      .catch((cause) => {
        if (!active) return;
        ackLifecycleRef.current = applyConsultationAckEvent(
          ackLifecycleRef.current,
          "detailFail",
        ).state;
        setError(String(cause));
        startPollFallback();
      });

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
      teardownRealtime?.();
    };
  }, [
    consultationId,
    reloadToken,
    recordDetailOkAndScheduleAck,
    scheduleAckOnlyIfDetailAlreadyOk,
    router,
  ]);

  const counterpartId = useMemo(() => {
    if (!consultation || !user?.id) return null;
    return consultation.initiatorId === user.id
      ? consultation.counterpartId
      : consultation.initiatorId;
  }, [consultation, user?.id]);

  const counterpartProfile = counterpartId
    ? getDeveloperProfileByUserId(counterpartId)
    : undefined;
  const counterpartName =
    counterpartProfile?.publicName?.trim() ||
    (counterpartId ? shortUserId(counterpartId) : "メッセージ");
  const selfName =
    (user?.id ? getDeveloperProfileByUserId(user.id)?.publicName?.trim() : null) ||
    "自分";
  const selfAvatarUrl = user?.id
    ? getDeveloperProfileByUserId(user.id)?.avatarUrl
    : undefined;

  const contextById = useMemo(() => {
    const map = new Map<string, CollabConsultationContext>();
    for (const ctx of pairContexts) map.set(ctx.consultationId, ctx);
    return map;
  }, [pairContexts]);

  if (unavailable) {
    return (
      <div className={embedded ? "flex h-full min-h-0 flex-col" : "mx-auto max-w-3xl"}>
        <p className="text-sm text-zinc-400">メッセージ一覧へ移動しています…</p>
      </div>
    );
  }

  async function send() {
    const text = body.trim();
    if (!text || !consultation) return;
    setError("");
    // Always post to the open segment (detail resolves open row).
    const response = await fetch(
      `/api/collab/consultations/${consultation.id}/messages`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      },
    );
    if (!response.ok) {
      setError("メッセージを送信できませんでした。");
      return;
    }
    setBody("");
    setReloadToken((token) => token + 1);
  }

  return (
    <div className={embedded ? "flex h-full min-h-0 flex-col" : "mx-auto max-w-3xl"}>
      {embedded ? (
        <Link href="/messages" className="text-sm text-violet-300 lg:hidden">
          ← メッセージ
        </Link>
      ) : (
        <Link href="/messages" className="text-sm text-violet-300">
          ← メッセージ
        </Link>
      )}

      <header className={`flex items-start gap-3 ${embedded ? "mt-2 lg:mt-0" : "mt-4"}`}>
        {counterpartId ? (
          <ThreadAvatar
            userId={counterpartId}
            name={counterpartName}
            avatarUrl={counterpartProfile?.avatarUrl}
          />
        ) : (
          <span className="size-8 shrink-0 rounded-full bg-zinc-800" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-white">{counterpartName}</h2>
          {counterpartId ? (
            <Link
              href={`/creators/${counterpartId}`}
              className="mt-0.5 inline-block text-xs text-violet-300 hover:text-violet-200"
            >
              プロフィールを見る
            </Link>
          ) : null}
        </div>
      </header>

      <div
        className={`${
          embedded ? "min-h-0 flex-1 overflow-y-auto" : ""
        } mt-6 space-y-2.5 pr-1`}
      >
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          const showContext =
            !prev || prev.consultationId !== message.consultationId;
          const ctx = contextById.get(message.consultationId);
          const mine = message.senderId === user?.id;
          const showAvatar = !prev || prev.senderId !== message.senderId;
          const avatarUserId = mine ? (user?.id ?? message.senderId) : message.senderId;
          const avatarName = mine ? selfName : counterpartName;
          const avatarUrl = mine
            ? selfAvatarUrl
            : counterpartProfile?.avatarUrl;

          const targetProject = ctx?.counterpartProjectId
            ? getGameById(ctx.counterpartProjectId)
            : null;
          const ownProject = ctx?.initiatorProjectId
            ? getGameById(ctx.initiatorProjectId)
            : null;

          return (
            <div key={message.id} className="space-y-2.5">
              {showContext && ctx ? (
                <ConsultationContextCard
                  projectTitle={targetProject?.title ?? null}
                  projectThumbnailUrl={
                    targetProject
                      ? resolveProjectThumbnailUrls(targetProject)[0] ?? null
                      : null
                  }
                  creatorName={
                    targetProject
                      ? counterpartName
                      : null
                  }
                  purpose={ctx.purpose}
                  ownProjectTitle={ownProject?.title ?? null}
                />
              ) : null}
              <div
                className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine ? (
                  showAvatar ? (
                    <ThreadAvatar
                      userId={avatarUserId}
                      name={avatarName}
                      avatarUrl={avatarUrl}
                    />
                  ) : (
                    <span className="size-8 shrink-0" aria-hidden="true" />
                  )
                ) : null}
                <div
                  className={`flex max-w-[65%] flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 ${
                      mine
                        ? "rounded-br-md bg-violet-600/80 text-white"
                        : "rounded-bl-md border border-zinc-800 bg-zinc-900 text-zinc-100"
                    }`}
                  >
                    <MessageBody body={message.body} />
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-2 px-1 text-[11px] text-zinc-500 ${
                      mine ? "flex-row-reverse" : ""
                    }`}
                  >
                    <time dateTime={message.createdAt}>
                      {new Date(message.createdAt).toLocaleString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {!mine ? (
                      <ContentReportButton
                        target={{
                          targetType: "consultation_message",
                          targetId: message.id,
                          contextLabel: "メッセージ",
                        }}
                        returnPath={`/messages/${consultationId}`}
                      />
                    ) : null}
                  </div>
                </div>
                {mine ? (
                  showAvatar ? (
                    <ThreadAvatar
                      userId={avatarUserId}
                      name={avatarName}
                      avatarUrl={avatarUrl}
                      mine
                    />
                  ) : (
                    <span className="size-8 shrink-0" aria-hidden="true" />
                  )
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {composingStart && counterpartId ? (
        <div className="sticky bottom-3 mt-6">
          <ConsultationStartForm
            counterpartId={counterpartId}
            counterpartName={counterpartName}
            counterpartProjectId={startProjectId}
            compact
            onCancel={() => {
              setComposeOverride("off");
              router.replace(`/messages/${consultation?.id ?? consultationId}`);
            }}
            onSuccess={(nextId) => {
              setComposeOverride("off");
              router.replace(`/messages/${nextId}`);
              setReloadToken((token) => token + 1);
            }}
          />
        </div>
      ) : consultation?.status === "open" ? (
        <div className="sticky bottom-3 mt-6 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            rows={3}
            aria-label="メッセージ"
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!body.trim()}
              onClick={() => void send()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              送信
            </button>
          </div>
        </div>
      ) : null}
      {ackError ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-amber-200">
          <p>{ackError}</p>
          <button
            type="button"
            className="rounded-lg border border-amber-500/40 px-3 py-1 text-amber-100"
            onClick={() => {
              const retry = applyConsultationAckEvent(
                ackLifecycleRef.current,
                "retryAck",
              );
              ackLifecycleRef.current = retry.state;
              if (!retry.shouldStartAck) return;
              void markConsultationAcknowledged()
                .then(() => {
                  ackLifecycleRef.current = applyConsultationAckEvent(
                    ackLifecycleRef.current,
                    "ackOk",
                  ).state;
                  setAckError("");
                })
                .catch((cause) => {
                  ackLifecycleRef.current = applyConsultationAckEvent(
                    ackLifecycleRef.current,
                    "ackFail",
                  ).state;
                  setAckError(String(cause));
                });
            }}
          >
            既読を再試行
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-300">
          <p>{error}</p>
          <button
            type="button"
            className="rounded-lg border border-red-500/40 px-3 py-1 text-red-100"
            onClick={() => {
              ackLifecycleRef.current = applyConsultationAckEvent(
                ackLifecycleRef.current,
                "retryDetail",
              ).state;
              setError("");
              setReloadToken((token) => token + 1);
            }}
          >
            再読み込み
          </button>
        </div>
      ) : null}
    </div>
  );
}
