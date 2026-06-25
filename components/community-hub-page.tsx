"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useCommunityJoinV0 } from "@/hooks/use-community-join-v0";
import {
  developerDevlogQuoteOptions,
  playerCommunityFeedMock,
  playerJoinedCommunities,
  studioCommunityPostsMock,
  studioCommunityProfile,
  studioOwnCommunityId,
  type CommunityPost,
  type DevlogQuoteRef,
} from "@/lib/community-v0-mock-data";
import type { CommunityJoinRequest, CommunityMember } from "@/lib/community-join-v0-store";
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
} from "lucide-react";

const COMMUNITY_MESSAGE_MAX = 1000;

type CommunityTab = "board" | "members";

function DevlogCitationCard({ quote }: { quote: DevlogQuoteRef }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950/60">
      <div className="flex gap-3 p-3">
        {quote.image && (
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
            <Image src={quote.image} alt="" fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-violet-300">
            <Quote className="size-3.5" aria-hidden="true" />
            Devlog {quote.version}
            {quote.publishedAt && (
              <span className="text-zinc-600">· {quote.publishedAt}</span>
            )}
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
        </div>
      </div>
    </div>
  );
}

function CommunityPostCard({ post }: { post: CommunityPost }) {
  return (
    <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="flex items-start gap-3">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
          <Image src={post.authorAvatar} alt="" fill className="object-cover" sizes="40px" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">{post.authorName}</span>
            <span className="text-xs text-zinc-600">@{post.authorHandle}</span>
            <span className="text-xs text-zinc-600">· {post.postedAt}</span>
          </div>
          <p className="mt-0.5 text-xs text-violet-400/90">{post.audienceLabel}</p>
          {post.devlogQuote && <DevlogCitationCard quote={post.devlogQuote} />}
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{post.body}</p>
        </div>
      </div>
    </article>
  );
}

function MemberRow({ member }: { member: CommunityMember }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
        <Image src={member.avatar} alt="" fill className="object-cover" sizes="40px" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200">{member.name}</p>
        <p className="text-xs text-zinc-500">@{member.handle} · 参加：{member.joinedAt}</p>
      </div>
    </li>
  );
}

function PendingRequestRow({
  request,
  onApprove,
  onReject,
}: {
  request: CommunityJoinRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <li className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
          <Image src={request.playerAvatar} alt="" fill className="object-cover" sizes="40px" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200">{request.playerName}</p>
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

function DeveloperComposePanel({
  onPost,
}: {
  onPost: (body: string, quote?: DevlogQuoteRef) => void;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [quoteId, setQuoteId] = useState<string>("");
  const selectedQuote = developerDevlogQuoteOptions.find((q) => q.id === quoteId);

  function reset() {
    setBody("");
    setQuoteId("");
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
        フォロワーへ連絡
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-zinc-500">
          宛先
          <select
            defaultValue="all"
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">フォロワー全員</option>
          </select>
        </label>
        <label className="block text-xs text-zinc-500">
          Devlog を引用
          <select
            value={quoteId}
            onChange={(e) => setQuoteId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="">引用しない</option>
            {developerDevlogQuoteOptions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.version} — {q.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedQuote && (
        <div className="mt-3">
          <DevlogCitationCard quote={selectedQuote} />
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
          disabled={!body.trim()}
          onClick={() => {
            onPost(body.trim(), selectedQuote);
            reset();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden="true" />
          フォロワーへ連絡
        </button>
      </div>
    </section>
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

function PlayerComposePanel({ onPost }: { onPost: (body: string) => void }) {
  const [body, setBody] = useState("");

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Megaphone className="size-4 text-emerald-400" aria-hidden="true" />
        コミュニティへ投稿
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        参加中の開発者コミュニティへメッセージを送れます（Devlog 引用は開発者のみ）。
      </p>
      <label className="mt-4 block text-xs text-zinc-500">
        メッセージ
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="プレイの感想や応援メッセージを…"
          className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
      </label>
      <button
        type="button"
        disabled={!body.trim()}
        onClick={() => {
          onPost(body.trim());
          setBody("");
        }}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        <Send className="size-4" aria-hidden="true" />
        投稿する
      </button>
    </section>
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

function CommunityHubContent({ variant }: { variant: "developer" | "player" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDeveloper = variant === "developer";
  const { pendingFor, membersFor, approveJoinRequest, rejectJoinRequest, getStatus } =
    useCommunityJoinV0();

  const activeTab = (searchParams.get("tab") === "members" ? "members" : "board") as CommunityTab;
  const selectedCommunityId = isDeveloper
    ? studioOwnCommunityId
    : (searchParams.get("community") ?? playerJoinedCommunities[0]?.id ?? "shaneco");

  const [posts, setPosts] = useState<CommunityPost[]>(
    isDeveloper ? studioCommunityPostsMock : playerCommunityFeedMock,
  );

  const pending = pendingFor(isDeveloper ? studioOwnCommunityId : selectedCommunityId);
  const members = membersFor(isDeveloper ? studioOwnCommunityId : selectedCommunityId);

  const joinedCommunities = playerJoinedCommunities.filter(
    (c) => getStatus(c.id) === "approved",
  );

  function setTab(tab: CommunityTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "board") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const base = isDeveloper ? "/studio/community" : "/mypage/community";
    const qs = params.toString();
    router.push(qs ? `${base}?${qs}` : base);
  }

  function selectCommunity(communityId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("community", communityId);
    const qs = params.toString();
    router.push(`/mypage/community?${qs}`);
  }

  const title = isDeveloper ? "マイコミュニティ" : "参加コミュニティ";
  const description = isDeveloper
    ? studioCommunityProfile.description
    : "参加中の開発者コミュニティの掲示板。お知らせを受け取り、メッセージを送れます。";

  const selectedCommunity = playerJoinedCommunities.find((c) => c.id === selectedCommunityId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </header>

      {!isDeveloper && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-zinc-500">参加中のコミュニティ</p>
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
        </section>
      )}

      {isDeveloper && (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
              <Image
                src={studioCommunityProfile.avatar}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            </span>
            <div>
              <p className="font-semibold text-white">{studioCommunityProfile.name}</p>
              <p className="text-sm text-zinc-500">
                参加者 {studioCommunityProfile.memberCountLabel}人
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 sm:self-center"
            disabled
            title="v0 では準備中"
          >
            <Settings className="size-4" aria-hidden="true" />
            コミュニティ設定
          </button>
        </div>
      )}

      {!isDeveloper && selectedCommunity && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
          <p className="text-sm font-medium text-white">{selectedCommunity.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">参加者 {members.length}人</p>
        </div>
      )}

      <CommunityTabs
        activeTab={activeTab}
        onTabChange={setTab}
        pendingCount={isDeveloper ? pending.length : undefined}
      />

      {activeTab === "members" ? (
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
                      onApprove={approveJoinRequest}
                      onReject={rejectJoinRequest}
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
                <MemberRow key={member.id} member={member} />
              ))}
              {members.length === 0 && (
                <li className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                  まだ参加者がいません
                </li>
              )}
            </ul>
          </div>
        </section>
      ) : (
        <>
          {isDeveloper ? (
            <DeveloperComposePanel
              onPost={(body, quote) => {
                setPosts((prev) => [
                  {
                    id: `new-${Date.now()}`,
                    authorName: "しゃねこ",
                    authorAvatar: "/images/landing/game-1.png",
                    authorHandle: "shaneco_dev",
                    body,
                    postedAt: "たった今",
                    audienceLabel: "フォロワー全員",
                    devlogQuote: quote,
                  },
                  ...prev,
                ]);
              }}
            />
          ) : getStatus(selectedCommunityId) === "approved" ? (
            <PlayerComposePanel
              onPost={(body) => {
                setPosts((prev) => [
                  {
                    id: `new-${Date.now()}`,
                    authorName: "あなた",
                    authorAvatar: "/images/landing/game-4.png",
                    authorHandle: "player_you",
                    body,
                    postedAt: "たった今",
                    audienceLabel: selectedCommunity?.name ?? "参加コミュニティ",
                  },
                  ...prev,
                ]);
              }}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
              このコミュニティに参加すると掲示板へ投稿できます。
            </p>
          )}

          <section className="space-y-4">
            {posts.map((post) => (
              <CommunityPostCard key={post.id} post={post} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export function CommunityHubPage({ variant }: { variant: "developer" | "player" }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl">
          <p className="text-zinc-500">読み込み中…</p>
        </div>
      }
    >
      <CommunityHubContent variant={variant} />
    </Suspense>
  );
}
