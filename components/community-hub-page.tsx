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
  studioOwnCommunityId,
  type CommunityPost,
  type DevlogQuoteRef,
} from "@/lib/community-v0-mock-data";
import type { CommunityJoinRequest, CommunityMember } from "@/lib/community-join-v0-store";
import { Check, Megaphone, Quote, Send, Users, X } from "lucide-react";

type CommunityTab = "board" | "members";

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
          {post.devlogQuote && (
            <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
              <div className="flex items-center gap-1.5 text-xs text-violet-300">
                <Quote className="size-3.5" aria-hidden="true" />
                Devlog {post.devlogQuote.version}
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-200">{post.devlogQuote.title}</p>
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{post.devlogQuote.excerpt}</p>
            </div>
          )}
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
        <p className="text-xs text-zinc-500">@{member.handle} · 参加 {member.joinedAt}</p>
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
    <li className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
          <Image src={request.playerAvatar} alt="" fill className="object-cover" sizes="40px" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200">{request.playerName}</p>
          <p className="text-xs text-zinc-500">
            @{request.playerHandle} · 申請 {request.requestedAt}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onApprove(request.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          <Check className="size-4" aria-hidden="true" />
          許可
        </button>
        <button
          type="button"
          onClick={() => onReject(request.id)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600"
        >
          <X className="size-4" aria-hidden="true" />
          拒否
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
  const [body, setBody] = useState("");
  const [quoteId, setQuoteId] = useState<string>("");
  const selectedQuote = developerDevlogQuoteOptions.find((q) => q.id === quoteId);

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Megaphone className="size-4 text-violet-400" aria-hidden="true" />
        フォロワーへ連絡
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        掲示板的にフォロワー全員へお知らせできます。Devlog を引用してプレイ依頼も。
      </p>
      <label className="mt-4 block text-xs text-zinc-500">
        Devlog を引用（任意）
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
      {selectedQuote && (
        <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-zinc-400">
          {selectedQuote.excerpt}
        </div>
      )}
      <label className="mt-4 block text-xs text-zinc-500">
        メッセージ
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="みなさんぜひプレイお願いします！"
          className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
        />
      </label>
      <button
        type="button"
        disabled={!body.trim()}
        onClick={() => {
          onPost(body.trim(), selectedQuote);
          setBody("");
          setQuoteId("");
        }}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        <Send className="size-4" aria-hidden="true" />
        フォロワーに送信
      </button>
    </section>
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
    ? "フォロワーへのお知らせと交流。参加申請の許可・拒否もここで行えます。"
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
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3">
          <p className="text-sm font-medium text-white">しゃねこ コミュニティ</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            参加者 {members.length}人
            {pending.length > 0 && ` · 新規申請 ${pending.length}件`}
          </p>
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
          {isDeveloper && pending.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-amber-300">新規参加申請</h2>
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
            </div>
          )}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Users className="size-4" aria-hidden="true" />
              参加者一覧（{members.length}人）
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
                    authorHandle: "shaneco",
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
