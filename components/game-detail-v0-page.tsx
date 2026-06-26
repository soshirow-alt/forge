"use client";

import Image from "next/image";
import Link from "next/link";
import { GameChangeCheckCard } from "@/components/game-change-check-card";
import { GameChangeCheckSection } from "@/components/game-change-check-section";
import {
  GameDetailRealVoiceLayer,
  useGameDetailEngagement,
  type GameDetailRealVoiceHandle,
} from "@/components/game-detail-real-voice-layer";
import { GameDetailHeroGallery } from "@/components/game-detail-hero-gallery";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FeedbackFormV0Modal,
  FeedbackSuccessV0Modal,
  FirstVoiceV0Modal,
  PlayStubV0Modal,
  useFeedbackFlowLock,
  type FeedbackFlowStep,
} from "@/components/feedback-v0-modals";
import { GameDetailOverviewV0Tab } from "@/components/game-detail-overview-v0-tab";
import { GameDevlogV0Tab } from "@/components/game-devlog-v0-tab";
import { GameVoicesV0Tab } from "@/components/game-voices-v0-tab";
import { FeatureComingSoonPanel } from "@/components/feature-coming-soon-panel";
import { GameNotFoundPanel } from "@/components/game-not-found-panel";
import { GameThumbnail, PlayerShell } from "@/components/player-shell";
import { useGames } from "@/components/games-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { gameDetailReturnPath } from "@/lib/login-return-url";
import {
  parseChangeCheckPreviewOverride,
  resolveChangeCheckPreviewState,
} from "@/lib/change-check-preview-mock";
import { getGameDetailV0, gameDetailIdFromTitle, resolveGameDetailId } from "@/lib/game-detail-v0-mock-data";
import {
  gameToDetailV0,
  isSupabaseProjectId,
} from "@/lib/submitted-game-v0-adapter";
import {
  appendSessionVoice,
  createPreviewVoiceEntry,
} from "@/lib/game-voices-v0-mock-data";
import { firstVoiceQuestion } from "@/lib/feedback-v0-mock-data";
import { applyProjectOverviewV0 } from "@/lib/project-overview-v0-store";
import { projectStudioPath } from "@/lib/project-nurture-links";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { useProjectOverviewV0 } from "@/hooks/use-project-overview-v0";
import {
  Bookmark,
  Check,
  Clock,
  FileText,
  Heart,
  MessageSquare,
  Play,
  Users,
} from "lucide-react";

type DetailTab = "overview" | "devlog" | "voices";

const tabs: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "概要" },
  { id: "devlog", label: "開発ログ" },
  { id: "voices", label: "みんなのフィードバック" },
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

function parseDetailTab(param: string | null): DetailTab {
  if (param === "versions") {
    return "devlog";
  }
  if (param === "devlog" || param === "voices") {
    return param;
  }
  return "overview";
}

function GameDetailV0PageContent({ id }: { id: string }) {
  const { getSubmittedGameById, dataReady } = useGames();
  const hideV0Mock = shouldHideV0MockContent();
  const submittedGame = dataReady ? getSubmittedGameById(id) : undefined;

  if (hideV0Mock) {
    if (!dataReady) {
      return (
        <PlayerShell>
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </PlayerShell>
      );
    }
    const hasRealProject = Boolean(
      isSupabaseProjectId(id) &&
        submittedGame &&
        isSupabaseProjectId(submittedGame.id),
    );
    if (!hasRealProject) {
      return <GameNotFoundPanel />;
    }
  }

  return <GameDetailV0PageBody id={id} />;
}

function GameDetailV0PageBody({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const {
    getSubmittedGameById,
    dataReady,
    recordPlay,
    hasPlayedGame,
    isProjectOwner,
    getOwnedProjects,
  } = useGames();
  const submittedGame = dataReady ? getSubmittedGameById(id) : undefined;
  const hideV0Mock = shouldHideV0MockContent();
  const isRealProject = Boolean(
    submittedGame && isSupabaseProjectId(submittedGame.id),
  );
  const game = useMemo(() => {
    if (submittedGame && isSupabaseProjectId(submittedGame.id)) {
      return gameToDetailV0(submittedGame);
    }
    return getGameDetailV0(id);
  }, [id, submittedGame]);
  const hasRealPlayUrl = Boolean(submittedGame?.playUrl?.trim());
  const resolvedId = isSupabaseProjectId(id) ? id : resolveGameDetailId(id);
  const { revision: overviewRevision } = useProjectOverviewV0(resolvedId);
  const displayGame = useMemo(() => {
    const base = game;
    return applyProjectOverviewV0(base, resolvedId);
  }, [game, resolvedId, overviewRevision]);
  const { isLoggedIn, hydrated, requireAuth, user } = useRequireAuth();
  const returnPath = gameDetailReturnPath(resolvedId);
  const detailId = resolveGameDetailId(id);
  const ownerProjectId = useMemo(() => {
    if (!user?.id) {
      return null;
    }
    if (isProjectOwner(resolvedId, user.id)) {
      return resolvedId;
    }
    if (isProjectOwner(id, user.id)) {
      return id;
    }
    const owned = getOwnedProjects(user.id);
    const match = owned.find((project) => {
      if (project.id === id || project.id === resolvedId) {
        return true;
      }
      return gameDetailIdFromTitle(project.title) === detailId;
    });
    return match?.id ?? null;
  }, [user?.id, isProjectOwner, getOwnedProjects, resolvedId, id, detailId]);
  const isOwnerPreview = ownerProjectId !== null;
  const ownerStudioHref = ownerProjectId
    ? isSupabaseProjectId(ownerProjectId)
      ? projectStudioPath(ownerProjectId)
      : `/studio/projects/${encodeURIComponent(ownerProjectId)}`
    : null;
  const [activeTab, setActiveTab] = useState<DetailTab>(() =>
    parseDetailTab(searchParams.get("tab")),
  );
  const [feedbackStep, setFeedbackStep] = useState<FeedbackFlowStep>("closed");
  const [voicesRefreshKey, setVoicesRefreshKey] = useState(0);
  const [following, setFollowing] = useState(game.developer.following);
  const [mockWatching, setMockWatching] = useState(game.watching);
  const [mockSaved, setMockSaved] = useState(game.saved);
  const [played, setPlayed] = useState(false);
  const voiceLayerRef = useRef<GameDetailRealVoiceHandle>(null);
  const {
    watching: realWatching,
    saved: realSaved,
    toggleWatch,
    toggleSaved,
  } = useGameDetailEngagement(resolvedId, isRealProject);
  const watching = isRealProject ? realWatching : mockWatching;
  const saved = isRealProject ? realSaved : mockSaved;

  const changeCheckOverride = parseChangeCheckPreviewOverride(
    searchParams.get("changeCheck"),
  );
  const previewChangeCheckState = resolveChangeCheckPreviewState(
    resolvedId,
    changeCheckOverride,
  );
  const returningPreview = searchParams.get("returning") === "1";
  const isReturningPlayer =
    returningPreview || (hydrated && isLoggedIn && hasPlayedGame(resolvedId));
  const showPreviewChangeCheck = Boolean(
    !isRealProject && isReturningPlayer && previewChangeCheckState,
  );

  useEffect(() => {
    if (isRealProject && hydrated && isLoggedIn) {
      setPlayed(hasPlayedGame(resolvedId));
    }
  }, [isRealProject, hydrated, isLoggedIn, hasPlayedGame, resolvedId]);

  const handlePlay = useCallback(() => {
    requireAuth(async () => {
      if (hasRealPlayUrl && submittedGame?.playUrl) {
        await recordPlay(submittedGame.id);
        window.open(submittedGame.playUrl, "_blank", "noopener,noreferrer");
        if (isRealProject) {
          setPlayed(true);
          voiceLayerRef.current?.notifyPlayComplete();
          return;
        }
        setFeedbackStep("first-voice");
        return;
      }
      setFeedbackStep("play-stub");
    }, returnPath);
  }, [
    requireAuth,
    returnPath,
    hasRealPlayUrl,
    submittedGame,
    recordPlay,
    isRealProject,
  ]);

  const handleFeedback = useCallback(() => {
    requireAuth(() => {
      if (isRealProject) {
        voiceLayerRef.current?.openForm();
        return;
      }
      setFeedbackStep("full-form");
    }, returnPath);
  }, [requireAuth, returnPath, isRealProject]);

  const handleProtectedAction = useCallback(
    (action: () => void) => {
      requireAuth(action, returnPath);
    },
    [requireAuth, returnPath],
  );

  const handleFeedbackSuccess = useCallback(
    (body?: string) => {
      if (isRealProject) {
        return;
      }
      const defaultBody = `${firstVoiceQuestion.question}：ちょうどよい。世界観がとても良かったです。最終章が楽しみです。`;
      appendSessionVoice(game.id, createPreviewVoiceEntry(body?.trim() || defaultBody));
      setVoicesRefreshKey((value) => value + 1);
      setActiveTab("voices");
      setFeedbackStep("success");
    },
    [game.id, isRealProject],
  );

  const handleRealVoiceComplete = useCallback(() => {
    setVoicesRefreshKey((value) => value + 1);
    setActiveTab("voices");
  }, []);

  useFeedbackFlowLock(isRealProject ? "closed" : feedbackStep);

  return (
    <PlayerShell>
      {isRealProject ? (
        <GameDetailRealVoiceLayer
          ref={voiceLayerRef}
          gameId={resolvedId}
          played={played}
          onVoiceComplete={handleRealVoiceComplete}
        />
      ) : (
        <>
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
              onSubmitQuick={(answerLabel) =>
                handleFeedbackSuccess(
                  `${firstVoiceQuestion.question}：${answerLabel}。プレイしてみて感じたことを開発者に届けました。`,
                )
              }
            />
          )}
          {feedbackStep === "full-form" && (
            <FeedbackFormV0Modal
              game={game}
              onClose={() => setFeedbackStep("closed")}
              onSubmit={handleFeedbackSuccess}
            />
          )}
          {feedbackStep === "success" && (
            <FeedbackSuccessV0Modal game={game} onClose={() => setFeedbackStep("closed")} />
          )}
        </>
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
              <GameDetailHeroGallery images={game.galleryImages} />

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
                  {!isRealProject ? (
                    <>
                      <StatItem
                        icon={<Users className="size-4" aria-hidden="true" />}
                        label="見届け"
                        value={game.witnessCount.toLocaleString()}
                      />
                      <StatItem
                        icon={<MessageSquare className="size-4" aria-hidden="true" />}
                        label="フィードバック"
                        value={game.voiceCount.toLocaleString()}
                      />
                    </>
                  ) : null}
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

          {isOwnerPreview ? (
            <div className="rounded-xl border border-orange-500/25 bg-orange-500/5 px-4 py-3 sm:px-5">
              <p className="text-sm font-medium text-orange-200">
                プレイヤー向けページのプレビュー
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                公開中の見え方を確認しています。フォローなどプレイヤー向け操作は別アカウントで試してください。
              </p>
              {ownerStudioHref ? (
                <Link
                  href={ownerStudioHref}
                  className="mt-3 inline-flex rounded-xl border border-zinc-700 bg-zinc-950/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-orange-500/40 hover:text-white"
                >
                  作品を更新する
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePlay}
              disabled={!hydrated}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="size-4" aria-hidden="true" />
              {hydrated && !isLoggedIn ? "ログインしてプレイ" : "プレイする"}
            </button>
            <button
              type="button"
              onClick={() =>
                handleProtectedAction(() => {
                  if (isRealProject) {
                    void toggleWatch();
                    return;
                  }
                  setMockWatching((value) => !value);
                })
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                watching
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <Check className="size-4" aria-hidden="true" />
              {watching ? "見届け中" : "見届ける"}
            </button>
            <button
              type="button"
              onClick={() =>
                handleProtectedAction(() => {
                  if (isRealProject) {
                    void toggleSaved();
                    return;
                  }
                  setMockSaved((value) => !value);
                })
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                saved
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <Bookmark className="size-4" aria-hidden="true" />
              {saved ? "保存済み" : "あとで遊ぶ"}
            </button>
            {!isOwnerPreview && !hideV0Mock ? (
              <button
                type="button"
                onClick={() => handleProtectedAction(() => setFollowing((value) => !value))}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  following
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white"
                }`}
              >
                <Heart className="size-4" aria-hidden="true" />
                {following ? "開発者フォロー中" : "開発者をフォロー"}
              </button>
            ) : null}
          </div>

          {isRealProject && !isOwnerPreview ? (
            <GameChangeCheckSection
              gameId={resolvedId}
              playableVersion={submittedGame?.playableVersion}
              onTryVersion={handlePlay}
              onViewUpdate={() => setActiveTab("devlog")}
            />
          ) : null}

          {showPreviewChangeCheck && previewChangeCheckState ? (
            <GameChangeCheckCard
              state={previewChangeCheckState}
              currentVersion={game.currentVersion}
              onViewUpdate={() => setActiveTab("devlog")}
              onTryVersion={handlePlay}
            />
          ) : null}

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
            <GameDetailOverviewV0Tab
              game={displayGame}
              onFeedback={handleFeedback}
              feedbackCtaLabel={
                hydrated && !isLoggedIn
                  ? "ログインしてフィードバックする"
                  : "フィードバックする"
              }
            />
          )}

          {activeTab === "devlog" && (
            <GameDevlogV0Tab
              gameId={resolveGameDetailId(id)}
              onPlayLatest={handlePlay}
            />
          )}
          {activeTab === "voices" &&
            (hideV0Mock ? (
              <FeatureComingSoonPanel
                title="みんなのフィードバック"
                description="他のプレイヤーのフィードバックを見る機能は準備中です。"
              />
            ) : (
              <GameVoicesV0Tab
                gameId={resolveGameDetailId(id)}
                currentVersion={game.currentVersion}
                refreshKey={voicesRefreshKey}
                onSendVoice={handleFeedback}
              />
            ))}
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
                {!isRealProject && game.developer.followers > 0 ? (
                  <p className="text-xs text-zinc-500">
                    フォロワー {game.developer.followers.toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>
            {game.developer.bio ? (
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">{game.developer.bio}</p>
            ) : null}
            {!isOwnerPreview && !hideV0Mock ? (
              <button
                type="button"
                onClick={() => handleProtectedAction(() => setFollowing((value) => !value))}
                className={`mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  following
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-zinc-700 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                {following ? "開発者フォロー中" : "開発者をフォローする"}
              </button>
            ) : null}
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

          {game.relatedGames.length > 0 ? (
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
          ) : null}
        </aside>
        )}
      </div>
    </PlayerShell>
  );
}

export function GameDetailV0Page({ id }: { id: string }) {
  return (
    <Suspense
      fallback={
        <PlayerShell>
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </PlayerShell>
      }
    >
      <GameDetailV0PageContent id={id} />
    </Suspense>
  );
}
