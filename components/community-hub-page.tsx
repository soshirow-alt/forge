"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ConfirmationCitationCard } from "@/components/confirmation-citation-card";
import { ContentReportButton } from "@/components/content-report-button";
import { ProfileAvatar } from "@/components/profile-avatar";
import {
  EMPTY_COMMUNITY_POSTS,
  useCommunityBoard,
} from "@/hooks/use-community-board";
import { useCommunityHubSupabase } from "@/hooks/use-community-hub-supabase";
import { useCommunityJoinV0 } from "@/hooks/use-community-join-v0";
import { useDeveloperCommunitiesV0 } from "@/hooks/use-developer-communities-v0";
import {
  ensureOwnDeveloperCommunity,
  findOwnCommunityInList,
  updateDeveloperCommunity,
  type DeveloperCommunityProfile,
} from "@/lib/developer-community-v0-store";
import type { ConfirmationRequestQuoteRef } from "@/lib/community-types";
import { confirmationQuoteHref } from "@/lib/community-types";
import {
  developerConfirmationQuoteOptions,
  mergeDevlogQuoteOptions,
  playerCommunityFeedMock,
  playerJoinedCommunities,
  studioCommunityPostsMock,
  allPlayerCommunities,
  devlogQuoteHref,
  type CommunityPost,
  type CommunityReply,
  type DevlogQuoteRef,
} from "@/lib/community-v0-mock-data";
import {
  isMockCommunityId,
  isSafeDeveloperCommunityProfile,
} from "@/lib/community-mock-guards";
import type { CommunityJoinRequest, CommunityMember } from "@/lib/community-join-v0-store";
import {
  communityJoinRequestProfileHref,
  communityMemberProfileHref,
} from "@/lib/community-member-profile";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { isReportableContentId } from "@/lib/content-reports";
import {
  ensureDeveloperCommunity,
  fetchCommunityMembershipStatus,
  fetchConfirmationQuoteOptionsForOwner,
  setCommunityMembershipStatus,
  updateDeveloperCommunityProfile,
} from "@/lib/supabase/community-db";
import {
  Check,
  Heart,
  Megaphone,
  MessageCircle,
  Quote,
  Send,
  Settings,
  Users,
  X,
  ChevronDown,
} from "lucide-react";

const DEVLOG_QUOTE_SELECT_MAX_VISIBLE = 4;

const COMMUNITY_MESSAGE_MAX = 1000;
const COMMUNITY_TITLE_MAX = 80;
const COMMUNITY_NAME_MAX = 40;
const COMMUNITY_DESCRIPTION_MAX = 160;

type CommunityTab = "board" | "members";

function DevlogCitationCard({
  quote,
  linkable = true,
}: {
  quote: DevlogQuoteRef;
  linkable?: boolean;
}) {
  const inner = (
    <div className="flex gap-3 p-3">
      {quote.image && (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
          <Image src={quote.image} alt="" fill className="object-cover" sizes="64px" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs text-violet-300">
          <Quote className="size-3.5" aria-hidden="true" />
          開発ログ {quote.version}
          {quote.publishedAt && <span className="text-zinc-600">· {quote.publishedAt}</span>}
        </div>
        <p className="mt-1 text-sm font-medium text-zinc-200">{quote.title}</p>
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{quote.excerpt}</p>
        {(quote.likeCount !== undefined || quote.commentCount !== undefined) && (
          <div className="mt-2 flex gap-3 text-xs text-zinc-500">
            {quote.likeCount !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" aria-hidden="true" />
                {quote.likeCount}
              </span>
            )}
            {quote.commentCount !== undefined && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" aria-hidden="true" />
                {quote.commentCount}
              </span>
            )}
          </div>
        )}
        {quote.confirmation && (
          <div className="mt-3 border-t border-orange-500/20 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-orange-300/90">
              <Quote className="size-3.5" aria-hidden="true" />
              確認依頼
              {quote.confirmation.estimatedDuration ? (
                <span className="text-zinc-600">· 目安 {quote.confirmation.estimatedDuration}</span>
              ) : null}
            </div>
            {quote.confirmation.changesSummary ? (
              <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                {quote.confirmation.changesSummary}
              </p>
            ) : null}
            {quote.confirmation.askSummary ? (
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                見てほしいこと: {quote.confirmation.askSummary}
              </p>
            ) : null}
            {quote.confirmation.linkedPriorityTitles &&
            quote.confirmation.linkedPriorityTitles.length > 0 ? (
              <p className="mt-2 text-xs text-orange-300/80">
                対応課題: {quote.confirmation.linkedPriorityTitles.join("、")}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  const className = quote.confirmation
    ? "mt-3 overflow-hidden rounded-xl border border-orange-500/25 bg-orange-500/[0.06] transition-colors"
    : "mt-3 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/60 transition-colors";

  if (!linkable) {
    return <div className={className}>{inner}</div>;
  }

  const href = quote.confirmation
    ? confirmationQuoteHref(quote.confirmation)
    : devlogQuoteHref(quote);
  const hoverClass = quote.confirmation
    ? "block hover:border-orange-500/40 hover:bg-orange-500/10"
    : "block hover:border-violet-500/50 hover:bg-zinc-900/60";

  return (
    <Link href={href} className={`${className} ${hoverClass}`}>
      {inner}
    </Link>
  );
}

function CommunityPostCard({
  post,
  canReply,
  onReply,
  reportReturnPath,
}: {
  post: CommunityPost;
  canReply?: boolean;
  onReply?: (body: string) => void;
  reportReturnPath: string;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const showReport =
    shouldHideV0MockContent() && isReportableContentId(post.id);

  return (
    <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="flex items-start gap-3">
        <ProfileAvatar
          src={post.authorAvatar}
          className="size-10 shrink-0"
          size={40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">{post.authorName}</span>
            <span className="text-xs text-zinc-600">@{post.authorHandle}</span>
            <span className="text-xs text-zinc-600">· {post.postedAt}</span>
          </div>
          <p className="mt-0.5 text-xs text-violet-400/90">{post.audienceLabel}</p>
          {post.title ? (
            <h3 className="mt-2 text-base font-semibold text-white">{post.title}</h3>
          ) : null}
          {post.devlogQuote && <DevlogCitationCard quote={post.devlogQuote} />}
          {!post.devlogQuote && post.confirmationQuote && (
            <ConfirmationCitationCard quote={post.confirmationQuote} />
          )}
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{post.body}</p>

          {showReport ? (
            <div className="mt-3">
              <ContentReportButton
                target={{
                  targetType: "community_post",
                  targetId: post.id,
                  contextLabel: post.title ?? post.body.slice(0, 40),
                }}
                returnPath={reportReturnPath}
              />
            </div>
          ) : null}

          {(post.replies?.length ?? 0) > 0 && (
            <ul className="mt-4 space-y-3 border-t border-zinc-800/80 pt-4">
              {post.replies?.map((reply) => (
                <li key={reply.id} className="flex gap-3">
                  <ProfileAvatar
                    src={reply.authorAvatar}
                    className="size-8 shrink-0"
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        href={communityMemberProfileHref({ handle: reply.authorHandle })}
                        className="font-medium text-zinc-200 hover:text-violet-300"
                      >
                        {reply.authorName}
                      </Link>
                      <span className="text-zinc-600">@{reply.authorHandle}</span>
                      <span className="text-zinc-600">· {reply.postedAt}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{reply.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {canReply && onReply && (
            <div className="mt-4 border-t border-zinc-800/80 pt-4">
              {replyOpen ? (
                <div className="space-y-2">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={3}
                    placeholder="開発者スレッドへ返信…"
                    className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyOpen(false);
                        setReplyBody("");
                      }}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      disabled={!replyBody.trim()}
                      onClick={() => {
                        onReply(replyBody.trim());
                        setReplyBody("");
                        setReplyOpen(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                    >
                      <MessageCircle className="size-3.5" aria-hidden="true" />
                      返信する
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setReplyOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  返信する
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function MemberRow({
  member,
  returnTo,
}: {
  member: CommunityMember;
  returnTo: string;
}) {
  return (
    <li>
      <Link
        href={communityMemberProfileHref(member, { returnTo })}
        className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
      >
        <ProfileAvatar
          src={member.avatar}
          className="size-10 shrink-0"
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200">{member.name}</p>
          <p className="text-xs text-zinc-500">@{member.handle} · 参加：{member.joinedAt}</p>
        </div>
      </Link>
    </li>
  );
}

function PendingRequestRow({
  request,
  onApprove,
  onReject,
  returnTo,
}: {
  request: CommunityJoinRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  returnTo: string;
}) {
  return (
    <li className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <Link
          href={communityJoinRequestProfileHref(request, { returnTo })}
          className="shrink-0"
        >
          <ProfileAvatar
            src={request.playerAvatar}
            userId={request.playerId}
            className="size-10"
            size={40}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200">
            <Link
              href={communityJoinRequestProfileHref(request, { returnTo })}
              className="hover:text-violet-300"
            >
              {request.playerName}
            </Link>
          </p>
          <p className="text-xs text-zinc-500">
            @{request.playerHandle} · {request.requestedAt}
          </p>
          {request.message && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{request.message}</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onReject(request.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
        >
          <X className="size-4" aria-hidden="true" />
          拒否
        </button>
        <button
          type="button"
          onClick={() => onApprove(request.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20"
        >
          <Check className="size-4" aria-hidden="true" />
          承認
        </button>
      </div>
    </li>
  );
}

function DevlogQuoteSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (quoteId: string) => void;
  options: DevlogQuoteRef[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((q) => q.id === value);
  const label = selected
    ? `${selected.version} — ${selected.title}${selected.confirmation ? "（確認依頼付き）" : ""}`
    : "選んでください";

  return (
    <div className="relative">
      <label className="block text-xs text-zinc-500">
        開発ログを引用
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="mt-1 flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-left text-sm text-zinc-200 hover:border-zinc-600"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
        </button>
      </label>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            aria-label="開発ログを引用"
            className="absolute left-0 right-0 z-30 mt-1 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 py-1 shadow-xl"
            style={{ maxHeight: `${DEVLOG_QUOTE_SELECT_MAX_VISIBLE * 2.5}rem` }}
          >
            <li role="option" aria-selected={value === ""}>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-900 ${
                  value === "" ? "text-violet-200" : "text-zinc-300"
                }`}
              >
                引用しない
              </button>
            </li>
            {options.map((q) => (
              <li key={q.id} role="option" aria-selected={value === q.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(q.id);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-900 ${
                    value === q.id ? "text-violet-200" : "text-zinc-300"
                  }`}
                >
                  {q.version} — {q.title}
                  {q.confirmation ? (
                    <span className="ml-1 text-orange-300/80">（確認依頼付き）</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DeveloperComposePanel({
  ownerId,
  onPost,
}: {
  ownerId?: string;
  onPost: (title: string, body: string, quote?: { kind: "devlog"; ref: DevlogQuoteRef }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [quoteKind, setQuoteKind] = useState<"none" | "devlog">("none");
  const [devlogQuoteId, setDevlogQuoteId] = useState("");
  const [confirmationOptionsFromDb, setConfirmationOptionsFromDb] = useState<
    ConfirmationRequestQuoteRef[]
  >([]);
  const [confirmationOptionsLoaded, setConfirmationOptionsLoaded] = useState(false);

  useEffect(() => {
    if (!ownerId) {
      setConfirmationOptionsLoaded(true);
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setConfirmationOptionsLoaded(true);
      return;
    }

    void fetchConfirmationQuoteOptionsForOwner(supabase, ownerId)
      .then(setConfirmationOptionsFromDb)
      .finally(() => setConfirmationOptionsLoaded(true));
  }, [ownerId]);

  const confirmationOptions = useMemo(() => {
    if (confirmationOptionsFromDb.length > 0) {
      return confirmationOptionsFromDb;
    }
    if (!getOptionalSupabaseClient()) {
      return developerConfirmationQuoteOptions;
    }
    return [];
  }, [confirmationOptionsFromDb]);

  const devlogOptions = useMemo(
    () => mergeDevlogQuoteOptions(confirmationOptions),
    [confirmationOptions],
  );

  const devlogOptionsEmpty = confirmationOptionsLoaded && devlogOptions.length === 0;

  const selectedDevlogQuote = devlogOptions.find((q) => q.id === devlogQuoteId);

  function reset() {
    setTitle("");
    setBody("");
    setQuoteKind("none");
    setDevlogQuoteId("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
      >
        <Megaphone className="size-4" aria-hidden="true" />
        スレッドを作成
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <label className="block text-xs text-zinc-500">
        タイトル
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value.slice(0, COMMUNITY_TITLE_MAX))}
          placeholder="例: 序盤の導線について聞きたいです"
          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <span className="mt-1 block text-right text-xs text-zinc-600">
          {title.length}/{COMMUNITY_TITLE_MAX}
        </span>
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["none", "引用しない"],
            ["devlog", "開発ログ"],
          ] as const
        ).map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              setQuoteKind(kind);
              setDevlogQuoteId("");
            }}
            className={
              quoteKind === kind
                ? "rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200"
                : "rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-600"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {quoteKind === "devlog" && (
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-zinc-500">
            開発ログを引用します。公開時に確認依頼を付けたログは、カード内に「見てほしいこと」も一緒に表示されます。
          </p>
          {devlogOptionsEmpty ? (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 px-4 py-4">
              <p className="text-sm font-medium text-zinc-300">引用できる開発ログがまだありません</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                作品の開発ログを公開すると、ここに引用候補が並びます。確認依頼を付けたログは「確認依頼付き」として表示されます。
              </p>
              <Link
                href="/studio/mypage"
                className="mt-3 inline-flex text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                作品一覧から開発ログを書く →
              </Link>
            </div>
          ) : (
            <DevlogQuoteSelect
              value={devlogQuoteId}
              onChange={setDevlogQuoteId}
              options={devlogOptions}
            />
          )}
        </div>
      )}

      {selectedDevlogQuote && (
        <div className="mt-3">
          <DevlogCitationCard quote={selectedDevlogQuote} linkable={false} />
        </div>
      )}
      <label className="mt-4 block text-xs text-zinc-500">
        メッセージ
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, COMMUNITY_MESSAGE_MAX))}
          rows={4}
          placeholder="みなさんぜひプレイお願いします！"
          className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <span className="mt-1 block text-right text-xs text-zinc-600">
          {body.length}/{COMMUNITY_MESSAGE_MAX}
        </span>
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600"
        >
          キャンセル
        </button>
        <button
          type="button"
          disabled={!title.trim() || !body.trim()}
          onClick={() => {
            const quote =
              quoteKind === "devlog" && selectedDevlogQuote
                ? { kind: "devlog" as const, ref: selectedDevlogQuote }
                : undefined;
            onPost(title.trim(), body.trim(), quote);
            reset();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden="true" />
          スレッドを作成
        </button>
      </div>
    </section>
  );
}

function CommunitySettingsModal({
  open,
  profile,
  ownerId,
  onClose,
}: {
  open: boolean;
  profile: DeveloperCommunityProfile;
  ownerId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(profile.name);
    setDescription(profile.description);
    setSaveMessage(null);
  }, [open, profile]);

  if (!open) {
    return null;
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setSaving(true);
    const updated: DeveloperCommunityProfile = {
      ...profile,
      name: trimmedName,
      description: description.trim(),
    };
    if (!shouldHideV0MockContent()) {
      updateDeveloperCommunity(updated);
    }

    const supabase = getOptionalSupabaseClient();
    if (supabase) {
      try {
        await ensureDeveloperCommunity(supabase, {
          id: updated.id,
          ownerId,
          name: updated.name,
          description: updated.description,
          avatarUrl: updated.avatar,
          handle: updated.handle,
        });
        await updateDeveloperCommunityProfile(supabase, updated.id, {
          name: updated.name,
          description: updated.description,
        });
        setSaveMessage("保存しました。");
      } catch {
        setSaveMessage("ローカルに保存しました（サーバー同期は後で再試行してください）。");
      }
    } else {
      setSaveMessage("保存しました。");
    }

    setSaving(false);
    window.setTimeout(() => onClose(), 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="閉じる"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-settings-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="community-settings-title" className="text-lg font-semibold text-white">
              コミュニティ設定
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              参加者に見えるコミュニティ名と説明を編集できます。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:border-zinc-600 hover:text-white"
            aria-label="閉じる"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <label className="mt-5 block text-xs text-zinc-500">
          コミュニティ名
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, COMMUNITY_NAME_MAX))}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
          />
          <span className="mt-1 block text-right text-xs text-zinc-600">
            {name.length}/{COMMUNITY_NAME_MAX}
          </span>
        </label>

        <label className="mt-3 block text-xs text-zinc-500">
          説明
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value.slice(0, COMMUNITY_DESCRIPTION_MAX))
            }
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
          />
          <span className="mt-1 block text-right text-xs text-zinc-600">
            {description.length}/{COMMUNITY_DESCRIPTION_MAX}
          </span>
        </label>

        <p className="mt-3 text-xs text-zinc-600">ID: @{profile.handle}</p>

        {saveMessage ? (
          <p className="mt-4 text-sm text-emerald-300">{saveMessage}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={!name.trim() || saving}
            onClick={() => void handleSave()}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            保存する
          </button>
        </div>
      </section>
    </div>
  );
}

function CommunityJoinPrompt({ communityId }: { communityId: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-400">コミュニティに参加すると閲覧・返信できます</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">
        掲示板と参加者一覧は、承認済みのメンバーだけが見られます。
      </p>
      <Link
        href={`/creators/${communityId}`}
        className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
      >
        開発者プロフィールから参加申請
      </Link>
    </div>
  );
}

function ApplicationsEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-12 text-center">
      <Users className="mx-auto size-10 text-zinc-600" aria-hidden="true" />
      <p className="mt-4 text-sm font-medium text-zinc-400">新しい参加申請はありません</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">
        プレイヤーから申請があると、ここに表示されます。
      </p>
    </div>
  );
}

function filterVisibleThreads(
  posts: CommunityPost[],
  communityId: string,
  isDeveloper: boolean,
): CommunityPost[] {
  if (isDeveloper) {
    return posts.filter((post) => post.communityId === communityId);
  }
  return posts.filter(
    (post) => post.communityId === communityId && post.authorRole === "developer",
  );
}

function CommunityHubProfileSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between"
      aria-busy="true"
      aria-label="コミュニティ情報を読み込み中"
    >
      <div className="flex items-center gap-3">
        <div className="size-12 shrink-0 animate-pulse rounded-full bg-zinc-800/80" />
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded bg-zinc-800/80" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-800/60" />
        </div>
      </div>
      <div className="h-9 w-32 animate-pulse rounded-xl bg-zinc-800/60 sm:self-center" />
    </div>
  );
}

function CommunityJoinedPillsSkeleton() {
  return (
    <div
      className="flex flex-wrap gap-2"
      aria-busy="true"
      aria-label="参加コミュニティを読み込み中"
    >
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-8 w-28 animate-pulse rounded-full bg-zinc-800/70" />
      ))}
    </div>
  );
}

function CommunityBoardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="掲示板を読み込み中">
      {[0, 1, 2].map((key) => (
        <div key={key} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <div className="flex gap-3">
            <div className="size-10 shrink-0 animate-pulse rounded-full bg-zinc-800/80" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-zinc-800/80" />
              <div className="h-4 max-w-md animate-pulse rounded bg-zinc-800/60" />
              <div className="h-3 w-full animate-pulse rounded bg-zinc-800/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunityMembersSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="参加者を読み込み中">
      <div>
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-800/80" />
        <div className="mt-3 h-16 animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/40" />
      </div>
      <div>
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-800/80" />
        <ul className="mt-3 space-y-2">
          {[0, 1, 2].map((key) => (
            <li
              key={key}
              className="h-14 animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/40"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function CommunityTabs({
  activeTab,
  onTabChange,
  pendingCount,
}: {
  activeTab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
  pendingCount?: number;
}) {
  const tabs: { id: CommunityTab; label: string }[] = [
    { id: "board", label: "掲示板" },
    { id: "members", label: "参加者" },
  ];

  return (
    <div
      role="tablist"
      aria-label="コミュニティの表示切替"
      className="flex gap-1 border-b border-zinc-800/80 pb-px"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "border-violet-400 text-violet-100"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab.label}
          {tab.id === "members" && pendingCount !== undefined && pendingCount > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              {pendingCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function CommunityHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hydrated } = useAuth();
  const hideV0Mock = shouldHideV0MockContent();
  const { opened } = useDeveloperCommunitiesV0();
  const supabaseHub = useCommunityHubSupabase(false);
  const isDeveloper = false;
  const { pendingFor, membersFor, approveJoinRequest, rejectJoinRequest, getStatus } =
    useCommunityJoinV0();

  // localStorage はクライアント確定後のみ参照（SSR との不一致でクラッシュするのを防ぐ）
  const ownCommunityRaw =
    isDeveloper && hydrated && user && !hideV0Mock
      ? findOwnCommunityInList(user.id, user.name, opened)
      : null;
  const ownCommunity = isSafeDeveloperCommunityProfile(ownCommunityRaw)
    ? ownCommunityRaw
    : null;
  const supabaseDeveloperProfile = isSafeDeveloperCommunityProfile(
    supabaseHub.developerProfile,
  )
    ? supabaseHub.developerProfile
    : null;
  const developerCommunityId = hideV0Mock
    ? (supabaseDeveloperProfile?.id ?? "")
    : (ownCommunity?.id ?? "");
  const developerCommunityProfile: DeveloperCommunityProfile | null = hideV0Mock
    ? supabaseDeveloperProfile
    : ownCommunity;

  const hubLoading =
    !hydrated || (hideV0Mock && !supabaseHub.loaded);
  const developerHubPending = isDeveloper && (!hydrated || !user || hubLoading);
  const developerHubEmpty =
    isDeveloper && hydrated && Boolean(user) && !hubLoading && !developerCommunityProfile;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsProfile, setSettingsProfile] = useState<DeveloperCommunityProfile | null>(null);

  const activeTab = (searchParams.get("tab") === "members" ? "members" : "board") as CommunityTab;

  const mockJoinedCommunities = playerJoinedCommunities.filter(
    (c) => getStatus(c.id) === "approved" && !isMockCommunityId(c.id),
  );
  const joinedCommunities = hideV0Mock
    ? supabaseHub.joinedCommunities
        .filter((c) => !isMockCommunityId(c.id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          avatar: c.avatar,
          memberCount: c.memberCount,
        }))
    : hydrated && user
      ? mockJoinedCommunities
      : [];

  const communityParam = searchParams.get("community");
  const selectedCommunityId = isDeveloper
    ? developerCommunityId
    : (communityParam ?? joinedCommunities[0]?.id ?? "");

  const memberProfileReturnTo = selectedCommunityId
    ? `/mypage/community?tab=members&community=${encodeURIComponent(selectedCommunityId)}`
    : "/mypage/community?tab=members";

  const mockPosts = isDeveloper ? studioCommunityPostsMock : playerCommunityFeedMock;
  const boardSeedPosts =
    hideV0Mock || !user
      ? EMPTY_COMMUNITY_POSTS
      : mockPosts.filter((post) => !isMockCommunityId(post.communityId));
  const {
    posts,
    loaded: boardLoaded,
    prependPost,
    appendReply,
    persistPost,
    persistReply,
    authorResolver,
  } = useCommunityBoard(
    selectedCommunityId,
    hideV0Mock ? EMPTY_COMMUNITY_POSTS : boardSeedPosts,
  );

  const boardLoading = hideV0Mock && Boolean(selectedCommunityId) && !boardLoaded;

  const [dbMembershipStatus, setDbMembershipStatus] = useState<
    "none" | "pending" | "approved" | "rejected" | null
  >(null);

  useEffect(() => {
    if (hideV0Mock || !user || !selectedCommunityId) {
      if (!hideV0Mock) {
        setDbMembershipStatus(null);
      }
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (!supabase) {
      setDbMembershipStatus(null);
      return;
    }

    if (isDeveloper) {
      if (!developerCommunityProfile || !isSafeDeveloperCommunityProfile(developerCommunityProfile)) {
        return;
      }
      void ensureDeveloperCommunity(supabase, {
        id: developerCommunityId,
        ownerId: user.id,
        name: developerCommunityProfile.name,
        description: developerCommunityProfile.description,
        avatarUrl: developerCommunityProfile.avatar,
        handle: developerCommunityProfile.handle,
      });
    }

    void fetchCommunityMembershipStatus(supabase, selectedCommunityId, user.id).then(
        setDbMembershipStatus,
      );
  }, [
    user,
    selectedCommunityId,
    isDeveloper,
    developerCommunityId,
    developerCommunityProfile,
    hideV0Mock,
  ]);

  useEffect(() => {
    if (!hideV0Mock || !selectedCommunityId) {
      return;
    }
    void supabaseHub.reloadMembershipData(selectedCommunityId);
  }, [hideV0Mock, selectedCommunityId, supabaseHub.reloadMembershipData]);

  const pending = hideV0Mock ? supabaseHub.pending : pendingFor(selectedCommunityId);
  const members = hideV0Mock ? supabaseHub.members : membersFor(selectedCommunityId);

  const membershipStatus = hideV0Mock
    ? supabaseHub.membershipStatus
    : dbMembershipStatus && dbMembershipStatus !== "none"
      ? dbMembershipStatus
      : getStatus(selectedCommunityId);

  const canViewCommunity =
    isDeveloper || (selectedCommunityId !== "" && membershipStatus === "approved");

  const visibleThreads = filterVisibleThreads(
    posts,
    selectedCommunityId,
    isDeveloper,
  );

  function addReply(postId: string, body: string) {
    const author = user
      ? authorResolver(user.id)
      : {
          name: "あなた",
          handle: "player_you",
          avatar: "",
        };
    const reply: CommunityReply = {
      id: `reply-${Date.now()}`,
      authorName: author.name,
      authorAvatar: author.avatar,
      authorHandle: author.handle,
      body,
      postedAt: "たった今",
    };
    appendReply(postId, reply);

    if (user) {
      void persistReply({
        postId,
        authorId: user.id,
        body,
        author,
      });
    }
  }

  async function handleApproveJoin(requestId: string) {
    const request = pending.find((item) => item.id === requestId);
    if (hideV0Mock && request) {
      await supabaseHub.approveJoin(request);
      return;
    }
    approveJoinRequest(requestId);
    if (!request) {
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (supabase) {
      await setCommunityMembershipStatus(
        supabase,
        selectedCommunityId,
        request.playerId,
        "approved",
      );
    }
  }

  async function handleRejectJoin(requestId: string) {
    const request = pending.find((item) => item.id === requestId);
    if (hideV0Mock && request) {
      await supabaseHub.rejectJoin(request);
      return;
    }
    rejectJoinRequest(requestId);
    if (!request) {
      return;
    }

    const supabase = getOptionalSupabaseClient();
    if (supabase) {
      await setCommunityMembershipStatus(
        supabase,
        selectedCommunityId,
        request.playerId,
        "rejected",
      );
    }
  }

  function setTab(tab: CommunityTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "board") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const base = "/mypage/community";
    const qs = params.toString();
    router.push(qs ? `${base}?${qs}` : base);
  }

  function selectCommunity(communityId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("community", communityId);
    const qs = params.toString();
    router.push(`/mypage/community?${qs}`);
  }

  const title = "参加コミュニティ";
  const description = isDeveloper
    ? (developerCommunityProfile?.description ??
      "フォロワーと交流し、一緒にゲームを育てましょう")
    : "参加中の開発者コミュニティの掲示板。開発者のスレッドを閲覧し、返信できます。";

  const selectedCommunity =
    joinedCommunities.find((c) => c.id === selectedCommunityId) ??
    (isMockCommunityId(selectedCommunityId)
      ? undefined
      : allPlayerCommunities.find((c) => c.id === selectedCommunityId));

  const showCommunityPanel =
    Boolean(selectedCommunityId) ||
    (isDeveloper && (hubLoading || developerHubPending));
  const showBoardSkeleton = hubLoading || boardLoading;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </header>

      {!isDeveloper && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-zinc-500">参加中のコミュニティ</p>
          {hubLoading ? (
            <CommunityJoinedPillsSkeleton />
          ) : (
            <div className="flex flex-wrap gap-2">
              {joinedCommunities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCommunity(c.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    selectedCommunityId === c.id
                      ? "border-violet-500/50 bg-violet-600/15 text-violet-200"
                      : "border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  <span className="relative size-5 overflow-hidden rounded-full bg-zinc-800">
                    <Image src={c.avatar} alt="" fill className="object-cover" sizes="20px" />
                  </span>
                  {c.name}
                </button>
              ))}
              {joinedCommunities.length === 0 && (
                <p className="text-sm text-zinc-500">
                  まだ参加中のコミュニティがありません。開発者プロフィールから参加申請してください。
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {isDeveloper &&
        (developerHubPending ? (
          <CommunityHubProfileSkeleton />
        ) : developerCommunityProfile ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                <Image
                  src={developerCommunityProfile.avatar}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </span>
              <div>
                <p className="font-semibold text-white">{developerCommunityProfile.name}</p>
                <p className="text-sm text-zinc-500">
                  参加者 {developerCommunityProfile.memberCountLabel}人
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!user || !developerCommunityProfile) {
                  return;
                }
                if (!isSafeDeveloperCommunityProfile(developerCommunityProfile)) {
                  return;
                }
                if (hideV0Mock && supabaseDeveloperProfile) {
                  setSettingsProfile(supabaseDeveloperProfile);
                  setSettingsOpen(true);
                  return;
                }
                const profile = ensureOwnDeveloperCommunity(user.id, user.name, {
                  name: developerCommunityProfile.name,
                  avatar: developerCommunityProfile.avatar,
                  handle: developerCommunityProfile.handle,
                  description: developerCommunityProfile.description,
                });
                setSettingsProfile(profile);
                setSettingsOpen(true);
              }}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-white sm:self-center"
            >
              <Settings className="size-4" aria-hidden="true" />
              コミュニティ設定
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
            <p className="text-sm font-medium text-zinc-300">コミュニティを準備中です</p>
            <p className="mt-2 text-sm text-zinc-500">
              公開作品を作成すると、コミュニティが作成されます
            </p>
          </div>
        ))}

      {isDeveloper && settingsProfile && user ? (
        <CommunitySettingsModal
          open={settingsOpen}
          profile={settingsProfile}
          ownerId={user.id}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}

      {!isDeveloper && selectedCommunity && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
          <p className="text-sm font-medium text-white">{selectedCommunity.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {canViewCommunity ? `参加者 ${members.length}人` : "未参加 — 閲覧には参加が必要です"}
          </p>
        </div>
      )}

      {!isDeveloper && !hubLoading && !selectedCommunityId && (
        <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          参加中のコミュニティがありません。開発者プロフィールから参加申請してください。
        </p>
      )}

      {showCommunityPanel && (
        <>
      <CommunityTabs
        activeTab={activeTab}
        onTabChange={setTab}
        pendingCount={
          hubLoading ? undefined : isDeveloper ? pending.length : undefined
        }
      />

      {activeTab === "members" ? (
        hubLoading ? (
          <CommunityMembersSkeleton />
        ) : !canViewCommunity ? (
          <CommunityJoinPrompt communityId={selectedCommunityId} />
        ) : (
        <section className="space-y-6">
          {isDeveloper && (
            <div>
              <h2 className="text-sm font-medium text-zinc-300">新しい参加申請</h2>
              {pending.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {pending.map((request) => (
                    <PendingRequestRow
                      key={request.id}
                      request={request}
                      onApprove={handleApproveJoin}
                      onReject={handleRejectJoin}
                      returnTo={memberProfileReturnTo}
                    />
                  ))}
                </ul>
              ) : (
                <div className="mt-3">
                  <ApplicationsEmptyState />
                </div>
              )}
            </div>
          )}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Users className="size-4" aria-hidden="true" />
              参加者一覧
            </h2>
            <ul className="mt-3 space-y-2">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  returnTo={memberProfileReturnTo}
                />
              ))}
              {members.length === 0 && (
                <li className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                  まだ参加者がいません
                </li>
              )}
            </ul>
          </div>
        </section>
        )
      ) : showBoardSkeleton ? (
        <CommunityBoardSkeleton />
      ) : !canViewCommunity ? (
        <CommunityJoinPrompt communityId={selectedCommunityId} />
      ) : (
        <>
          {isDeveloper && developerCommunityProfile && (
            <DeveloperComposePanel
              ownerId={user?.id}
              onPost={(title, body, quote) => {
                const localPost: CommunityPost = {
                  id: `new-${Date.now()}`,
                  communityId: developerCommunityId,
                  authorRole: "developer",
                  authorName: user?.name ?? "あなた",
                  authorAvatar: developerCommunityProfile.avatar,
                  authorHandle: developerCommunityProfile.handle,
                  title,
                  body,
                  postedAt: "たった今",
                  audienceLabel: "コミュニティ全員",
                  devlogQuote: quote?.kind === "devlog" ? quote.ref : undefined,
                  replies: [],
                };
                prependPost(localPost);

                if (user) {
                  void persistPost({
                    communityId: developerCommunityId,
                    authorId: user.id,
                    authorRole: "developer",
                    title,
                    body,
                    devlogQuote: quote?.kind === "devlog" ? quote.ref : undefined,
                    confirmationQuote: quote?.ref?.confirmation,
                    confirmationRequestId: quote?.ref?.confirmation?.confirmationRequestId ?? null,
                    devlogId: quote?.ref?.confirmation?.devlogId ?? null,
                  });
                }
              }}
            />
          )}

          <section className="space-y-4">
            {visibleThreads.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                canReply={!isDeveloper && canViewCommunity}
                onReply={(body) => addReply(post.id, body)}
                reportReturnPath={
                  selectedCommunityId
                    ? `/mypage/community?community=${encodeURIComponent(selectedCommunityId)}`
                    : "/mypage/community"
                }
              />
            ))}
            {visibleThreads.length === 0 && (
              <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                まだスレッドがありません
              </p>
            )}
          </section>
        </>
      )}
        </>
      )}
    </div>
  );
}

export function CommunityHubPage() {
  return <CommunityHubContent />;
}
