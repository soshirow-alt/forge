"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FeedbackFormV0Modal,
  FeedbackSuccessV0Modal,
  FirstVoiceV0Modal,
  PlayStubV0Modal,
  useFeedbackFlowLock,
  type FeedbackFlowStep,
} from "@/components/feedback-v0-modals";
import { GameVoicesV0Tab } from "@/components/game-voices-v0-tab";
import { GameThumbnail, PlayerShell } from "@/components/player-shell";
import { getGameDetailV0 } from "@/lib/game-detail-v0-mock-data";
import {
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  Compass,
  FileText,
  Heart,
  MessageSquare,
  Play,
  Sparkles,
  Users,
} from "lucide-react";

type DetailTab = "overview" | "devlog" | "voices" | "versions";

const tabs: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "みんなの声" },
  { id: "versions", label: "版の履歴" },
];

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300">
      {children}
    </span>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <span className="text-violet-400">{icon}</span>
      <span>
        <span className="text-zinc-500">{label}</span>{" "}
        <span className="font-medium text-zinc-200">{value}</span>
      </span>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-violet-600/15 text-violet-300">
        <Sparkles className="size-4" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

function TabStub({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
      <p className="text-sm text-zinc-500">{label} — preview mock（実装 GO 待ち）</p>
    </div>
  );
}

export function GameDetailV0Page({ id }: { id: string }) {
  const game = getGameDetailV0(id);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [introExpanded, setIntroExpanded] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<FeedbackFlowStep>("closed");

  useFeedbackFlowLock(feedbackStep);

  const introPreview =
    game.introduction.length > 120 && !introExpanded
      ? `${game.introduction.slice(0, 120)}…`
      : game.introduction;

  return (
    <PlayerShell>
      {feedbackStep === "play-stub" && (
        <PlayStubV0Modal
          game={game}
          onClose={() => setFeedbackStep("closed")}
          onPlayComplete={() => setFeedbackStep("first-voice")}
        />
      )}
      {feedbackStep === "first-voice" && (
        <FirstVoiceV0Modal
          game={game}
          onClose={() => setFeedbackStep("closed")}
          onOpenFullForm={() => setFeedbackStep("full-form")}
          onSubmitQuick={() => setFeedbackStep("success")}
        />
      )}
      {feedbackStep === "full-form" && (
        <FeedbackFormV0Modal
          game={game}
          onClose={() => setFeedbackStep("closed")}
          onSubmit={() => setFeedbackStep("success")}
        />
      )}
      {feedbackStep === "success" && (
        <FeedbackSuccessV0Modal game={game} onClose={() => setFeedbackStep("closed")} />
      )}

      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          <nav className="text-sm text-zinc-500">
            <Link href="/home" className="transition-colors hover:text-violet-400">
              ホーム
            </Link>
            <span className="mx-2">›</span>
            <Link href="/search" className="transition-colors hover:text-violet-400">
              作品を探す
            </Link>
            <span className="mx-2">›</span>
            <span className="text-zinc-400">{game.title}</span>
          </nav>

          <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="relative min-h-[220px] lg:min-h-[320px]">
                <Image
                  src={game.heroImage}
                  alt=""
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0a0a0a]/40" />
              </div>

              <div className="flex flex-col justify-center p-6 lg:p-8">
                <div className="flex flex-wrap gap-2">
                  {game.tags.map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))}
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {game.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{game.lead}</p>
                <Link
                  href={`/creators/${game.developer.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-violet-300"
                >
                  <span className="relative size-7 overflow-hidden rounded-full bg-zinc-800">
                    <Image src={game.developer.avatar} alt="" fill className="object-cover" />
                  </span>
                  {game.developer.name}
                </Link>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <StatItem
                    icon={<Users className="size-4" aria-hidden="true" />}
                    label="見届け"
                    value={game.witnessCount.toLocaleString()}
                  />
                  <StatItem
                    icon={<MessageSquare className="size-4" aria-hidden="true" />}
                    label="声"
                    value={game.voiceCount.toLocaleString()}
                  />
                  <StatItem
                    icon={<FileText className="size-4" aria-hidden="true" />}
                    label="Devlog"
                    value={game.devlogUpdatedAgo}
                  />
                  <StatItem
                    icon={<Clock className="size-4" aria-hidden="true" />}
                    label="最終更新"
                    value={game.lastUpdated}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFeedbackStep("play-stub")}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <Play className="size-4" aria-hidden="true" />
              プレイする
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                game.watching
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <Check className="size-4" aria-hidden="true" />
              {game.watching ? "見届け中" : "見届ける"}
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                game.developer.following
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <Heart className="size-4" aria-hidden="true" />
              {game.developer.following ? "フォロー中" : "フォロー"}
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                game.saved
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <Bookmark className="size-4" aria-hidden="true" />
              あとで遊ぶ
            </button>
          </div>

          <div className="border-b border-zinc-800/80">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-200"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-white">作品紹介</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{introPreview}</p>
                  {game.introduction.length > 120 && (
                    <button
                      type="button"
                      onClick={() => setIntroExpanded((value) => !value)}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300"
                    >
                      {introExpanded ? "閉じる" : "もっと見る"}
                      <ChevronDown
                        className={`size-4 transition-transform ${introExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </section>

                <section>
                  <h2 className="text-base font-semibold text-white">作品の特徴</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {game.features.map((feature) => (
                      <FeatureCard
                        key={feature.title}
                        title={feature.title}
                        description={feature.description}
                      />
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-white">開発者の今の悩み</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{game.developerWorry}</p>
                  <button
                    type="button"
                    onClick={() => setFeedbackStep("full-form")}
                    className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                  >
                    声を届ける（フィードバック）
                  </button>
                </section>

                <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-white">現在ほしい声</h2>
                  <ul className="mt-4 space-y-3">
                    {game.wantedVoices.map((voice) => (
                      <li
                        key={voice}
                        className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-300"
                      >
                        <Compass className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden="true" />
                        {voice}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}

          {activeTab === "devlog" && <TabStub label="開発ログ" />}
          {activeTab === "voices" && (
            <GameVoicesV0Tab onSendVoice={() => setFeedbackStep("full-form")} />
          )}
          {activeTab === "versions" && <TabStub label="版の履歴" />}
        </div>

        {activeTab !== "voices" && (
        <aside className="w-full shrink-0 space-y-5 xl:w-72">
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-3">
              <span className="relative size-12 overflow-hidden rounded-full bg-zinc-800">
                <Image src={game.developer.avatar} alt="" fill className="object-cover" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{game.developer.name}</p>
                <p className="text-xs text-zinc-500">
                  フォロワー {game.developer.followers.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">{game.developer.bio}</p>
            <button
              type="button"
              className={`mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                game.developer.following
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {game.developer.following ? "フォロー中" : "フォローする"}
            </button>
            <Link
              href={`/creators/${game.developer.id}`}
              className="mt-2 block text-center text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              プロフィールを見る →
            </Link>
          </section>

          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">関連タグ</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {game.relatedTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-200"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
            <h2 className="text-sm font-semibold text-white">関連作品</h2>
            <ul className="mt-4 space-y-4">
              {game.relatedGames.map((related) => (
                <li key={related.id}>
                  <Link
                    href={`/games/${related.id}`}
                    className="flex gap-3 rounded-xl transition-colors hover:bg-zinc-800/40"
                  >
                    <GameThumbnail
                      src={related.image}
                      alt={related.title}
                      className="size-14 shrink-0"
                    />
                    <div className="min-w-0 py-0.5">
                      <p className="truncate text-sm font-medium text-white">{related.title}</p>
                      <p className="text-xs text-zinc-500">{related.genre}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
                        <Users className="size-3" aria-hidden="true" />
                        見届け {related.witnessCount.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/search"
              className="mt-4 block text-xs text-violet-400 transition-colors hover:text-violet-300"
            >
              関連作品をすべて見る →
            </Link>
          </section>
        </aside>
        )}
      </div>
    </PlayerShell>
  );
}
