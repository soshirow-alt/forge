"use client";

import Image from "next/image";
import { useState } from "react";
import {
  developerDevlogQuoteOptions,
  playerCommunityFeedMock,
  playerJoinedCommunities,
  studioCommunityPostsMock,
  type CommunityPost,
  type DevlogQuoteRef,
} from "@/lib/community-v0-mock-data";
import { Megaphone, Quote, Send } from "lucide-react";

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

export function CommunityHubPage({ variant }: { variant: "developer" | "player" }) {
  const isDeveloper = variant === "developer";
  const [posts, setPosts] = useState<CommunityPost[]>(
    isDeveloper ? studioCommunityPostsMock : playerCommunityFeedMock,
  );

  const title = isDeveloper ? "マイコミュニティ" : "参加コミュニティ";
  const description = isDeveloper
    ? "フォロワーへのお知らせと交流。Devlog を引用してプレイ依頼もできます。"
    : "フォロー中の開発者コミュニティの掲示板。お知らせを受け取り、メッセージを送れます。";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </header>

      {!isDeveloper && (
        <section className="flex flex-wrap gap-2">
          {playerJoinedCommunities.map((c) => (
            <span
              key={c.id}
              className="rounded-full border border-zinc-700/80 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400"
            >
              {c.name} · {c.memberCount.toLocaleString()}人
            </span>
          ))}
        </section>
      )}

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
      ) : (
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
                audienceLabel: "参加コミュニティ",
              },
              ...prev,
            ]);
          }}
        />
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-400">掲示板</h2>
        {posts.map((post) => (
          <CommunityPostCard key={post.id} post={post} />
        ))}
      </section>
    </div>
  );
}
