"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ProjectThumbnail } from "@/components/project-thumbnail";
import { useGames } from "@/components/games-provider";
import { ProjectDeleteButton } from "@/components/project-list-card";
import {
  useStudioProjectDeleteModal,
  type PendingProjectDelete,
} from "@/components/studio-project-delete-modal";
import {
  StudioFilterPills,
  StudioInlineSelect,
} from "@/components/studio-shell";
import { ViewModeToggle, type ViewMode } from "@/components/view-mode-toggle";
import { PageLoadingSkeleton } from "@/components/forge-loading-skeletons";
import { useOwnedProjectVoiceSignals } from "@/hooks/use-owned-project-voice-signals";
import { useOwnedPublicFeedbackUnread } from "@/hooks/use-owned-public-feedback-unread";
import { useNurtureVoiceRead } from "@/hooks/use-nurture-feedback-read";
import {
  matchesOwnedProjectDevPhaseFilter,
  matchesOwnedProjectOfficialFilter,
  matchesOwnedProjectVisibilityFilter,
  ownedProjectVisibilityLabel,
  isOwnedProjectOfficiallyReleased,
  STUDIO_DEV_PHASE_FILTER_OPTIONS,
  STUDIO_VISIBILITY_FILTER_OPTIONS,
} from "@/lib/owned-project-filters";
import {
  buildProjectGrowthSnapshot,
  getProjectStatusBadges,
  sortProjectsForGrowthHub,
  type ProjectGrowthSnapshot,
} from "@/lib/project-growth-state";
import { ProjectCardShareActions } from "@/components/project-card-share-actions";
import {
  projectStudioPath,
  projectStudioVoicesHref,
  studioSubmitModalHref,
} from "@/lib/project-nurture-links";
import { resolveVoiceSignalForGame } from "@/lib/project-voice-nurture";
import { isStudioMypagePreviewMockProject } from "@/lib/studio-mypage-owned-projects";
import type { Game } from "@/lib/mock-games";
import {
  STUDIO_PROJECTS_PAGE_SIZE,
  studioSortOptions,
  type StudioSortId,
} from "@/lib/studio-projects-v0-mock-data";
import { displayPhase } from "@/lib/development-phases";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  Search,
  Users,
} from "lucide-react";

const BADGE_TONE_CLASS: Record<
  ReturnType<typeof getProjectStatusBadges>[number]["tone"],
  string
> = {
  orange: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/30",
  amber: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30",
  sky: "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/30",
};

type OwnedProjectRow = {
  game: Game;
  growth: ProjectGrowthSnapshot;
  unreadPublicFeedbackCount: number;
  showDelete: boolean;
  voiceLoaded: boolean;
};

function UnreadPublicFeedbackBadge({
  projectId,
  count,
  className,
}: {
  projectId: string;
  count: number;
  className?: string;
}) {
  if (count <= 0) {
    return null;
  }

  return (
    <Link
      href={projectStudioVoicesHref(projectId)}
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex h-[28px] items-center gap-1 rounded-full bg-violet-600 px-2.5 text-[11px] font-semibold text-white shadow-sm shadow-violet-950/40 transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${className ?? ""}`}
      aria-label={`新着フィードバック ${count}件を確認`}
    >
      <MessageSquare className="size-3 shrink-0" aria-hidden="true" />
      <span className="whitespace-nowrap">新着FB {count}件</span>
      <ChevronRight className="size-3 shrink-0 opacity-90" aria-hidden="true" />
    </Link>
  );
}

function formatVoiceResponseCount(count: number, voiceLoaded: boolean): string {
  if (!voiceLoaded) {
    return "—";
  }
  return String(count);
}

function NewProjectCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const className = `flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 text-center transition-colors hover:border-violet-500/40 hover:bg-violet-500/5 ${
    compact ? "gap-2 px-4 py-8" : "min-h-[280px] gap-3 p-6"
  }`;

  return (
    <Link href={studioSubmitModalHref()} className={className}>
      <span className="flex size-12 items-center justify-center rounded-full bg-violet-600/20 text-violet-300">
        <Plus className="size-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-zinc-200">新しい作品を投稿</p>
      {!compact && (
        <p className="max-w-xs text-xs text-zinc-500">
          まだ誰も見たことのないあなたの作品を投稿しよう。
        </p>
      )}
    </Link>
  );
}

function OwnedProjectGridCard({
  row,
  onDelete,
  showDelete,
}: {
  row: OwnedProjectRow;
  onDelete: (project: PendingProjectDelete) => void;
  showDelete: boolean;
}) {
  const { game, growth, unreadPublicFeedbackCount, voiceLoaded } = row;
  const { isRead: voiceRead } = useNurtureVoiceRead(game.id, growth.playableVersion);
  const statusBadges = voiceLoaded ? getProjectStatusBadges(growth, voiceRead) : [];
  const hasHighlight = unreadPublicFeedbackCount > 0 || statusBadges.length > 0;
  const responseCountLabel = formatVoiceResponseCount(
    growth.totalVoiceResponseCount,
    voiceLoaded,
  );

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-zinc-900/40 ${
        hasHighlight
          ? "border-orange-500/50 ring-1 ring-orange-500/25"
          : "border-zinc-800"
      }`}
    >
      {unreadPublicFeedbackCount > 0 ? (
        <UnreadPublicFeedbackBadge
          projectId={game.id}
          count={unreadPublicFeedbackCount}
          className="absolute right-2 top-2 z-20"
        />
      ) : null}
      <Link
        href={projectStudioPath(game.id)}
        className="group flex flex-1 flex-col transition-colors hover:bg-zinc-900/70"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-zinc-800">
          <ProjectThumbnail
            projectId={game.id}
            title={game.title}
            genre={game.genre}
            version={game.phase}
            variant="hero"
            className="aspect-[16/10] h-full w-full rounded-none"
          />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate font-semibold text-white group-hover:text-violet-100">
              {game.title}
            </h2>
            {statusBadges.map((badge) => (
              <span
                key={badge.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_TONE_CLASS[badge.tone]}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{game.genre}</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            <span className="rounded-md border border-zinc-700 px-1.5 py-0.5 text-zinc-400">
              {ownedProjectVisibilityLabel(game)}
            </span>
            <span className="rounded-md border border-zinc-700 px-1.5 py-0.5 text-zinc-400">
              {displayPhase(game.phase)}
            </span>
            {isOwnedProjectOfficiallyReleased(game) ? (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300">
                正式版公開済み
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              <span>
                回答{" "}
                <span
                  className={
                    voiceLoaded ? "text-zinc-200" : "text-zinc-500"
                  }
                >
                  {responseCountLabel}
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              <span>
                ver{" "}
                <span className="text-zinc-200">{growth.playableVersion}</span>
              </span>
            </span>
          </div>
          <p className="mt-auto pt-4 text-xs text-zinc-500">
            最終更新：<span className="text-zinc-300">{game.lastUpdated}</span>
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 px-3 py-2">
        <ProjectCardShareActions game={game} />
        {showDelete ? (
          <ProjectDeleteButton
            onClick={() => onDelete({ id: game.id, title: game.title })}
          />
        ) : null}
      </div>
    </article>
  );
}

function OwnedProjectListRow({
  row,
  onDelete,
  showDelete,
}: {
  row: OwnedProjectRow;
  onDelete: (project: PendingProjectDelete) => void;
  showDelete: boolean;
}) {
  const { game, growth, unreadPublicFeedbackCount, voiceLoaded } = row;
  const { isRead: voiceRead } = useNurtureVoiceRead(game.id, growth.playableVersion);
  const statusBadges = voiceLoaded ? getProjectStatusBadges(growth, voiceRead) : [];
  const hasHighlight = unreadPublicFeedbackCount > 0 || statusBadges.length > 0;
  const responseCountLabel = formatVoiceResponseCount(
    growth.totalVoiceResponseCount,
    voiceLoaded,
  );

  return (
    <article
      className={`flex gap-3 rounded-2xl border bg-zinc-900/40 p-4 sm:items-center ${
        hasHighlight
          ? "border-orange-500/50 ring-1 ring-orange-500/25"
          : "border-zinc-800"
      }`}
    >
      <Link
        href={projectStudioPath(game.id)}
        className="flex min-w-0 flex-1 gap-4 transition-opacity hover:opacity-95 sm:items-center"
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-800/80">
          <ProjectThumbnail
            projectId={game.id}
            title={game.title}
            genre={game.genre}
            version={game.phase}
            variant="compact"
            className="h-full w-full rounded-lg"
            sizes="96px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="font-semibold text-zinc-100">{game.title}</h2>
            {statusBadges.map((badge) => (
              <span
                key={badge.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_TONE_CLASS[badge.tone]}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {game.genre} · ver {growth.playableVersion} · 回答{" "}
            <span className={voiceLoaded ? "text-zinc-400" : "text-zinc-600"}>
              {responseCountLabel}
            </span>{" "}
            · 最終更新 {game.lastUpdated}
          </p>
        </div>
      </Link>
      {unreadPublicFeedbackCount > 0 ? (
        <UnreadPublicFeedbackBadge
          projectId={game.id}
          count={unreadPublicFeedbackCount}
          className="shrink-0 self-center"
        />
      ) : null}
      <div className="mt-2">
        <ProjectCardShareActions game={game} />
      </div>
      {showDelete ? (
        <ProjectDeleteButton
          onClick={() => onDelete({ id: game.id, title: game.title })}
        />
      ) : null}
    </article>
  );
}

export function StudioOwnedProjectsDirectoryPanel({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const { user, hydrated } = useAuth();
  const {
    getStudioMypageOwnedProjects,
    deleteSubmittedGame,
    getDevlogsByProject,
    dataReady,
  } = useGames();
  const { signals: voiceSignals, loaded: voiceLoaded } =
    useOwnedProjectVoiceSignals(user?.id);
  const { getUnreadCount } = useOwnedPublicFeedbackUnread();
  const { requestDelete, modal } = useStudioProjectDeleteModal(deleteSubmittedGame);

  const [query, setQuery] = useState(initialQuery);
  const [visibility, setVisibility] = useState("all");
  const [devPhase, setDevPhase] = useState("all");
  const [onlyOfficial, setOnlyOfficial] = useState(false);
  const [sortId, setSortId] = useState<StudioSortId>("updated-desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const ownedRows = useMemo(() => {
    const ownedGames = getStudioMypageOwnedProjects(user?.id);
    const games = voiceLoaded
      ? sortProjectsForGrowthHub(ownedGames, voiceSignals, getDevlogsByProject)
      : [...ownedGames].sort((a, b) =>
          (b.lastUpdated || b.createdAt || "").localeCompare(
            a.lastUpdated || a.createdAt || "",
          ),
        );

    return games.map((game) => {
      const growth = buildProjectGrowthSnapshot(
        game,
        voiceLoaded
          ? resolveVoiceSignalForGame(game, voiceSignals)
          : resolveVoiceSignalForGame(game, []),
        getDevlogsByProject,
      );
      return {
        game,
        growth,
        unreadPublicFeedbackCount: getUnreadCount(game.id),
        showDelete: !isStudioMypagePreviewMockProject(game),
        voiceLoaded,
      };
    });
  }, [
    getDevlogsByProject,
    getStudioMypageOwnedProjects,
    getUnreadCount,
    user?.id,
    voiceLoaded,
    voiceSignals,
  ]);

  const filtered = useMemo(() => {
    let list = [...ownedRows];
    list = list.filter((row) =>
      matchesOwnedProjectVisibilityFilter(row.game, visibility),
    );
    list = list.filter((row) =>
      matchesOwnedProjectDevPhaseFilter(row.game, devPhase),
    );
    list = list.filter((row) =>
      matchesOwnedProjectOfficialFilter(row.game, onlyOfficial),
    );
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((row) => row.game.title.toLowerCase().includes(q));
    }
    if (sortId === "title-asc") {
      list.sort((a, b) => a.game.title.localeCompare(b.game.title, "ja"));
    } else if (sortId === "updated-asc") {
      list.sort((a, b) => a.game.lastUpdated.localeCompare(b.game.lastUpdated));
    } else {
      list.sort((a, b) => b.game.lastUpdated.localeCompare(a.game.lastUpdated));
    }
    return list;
  }, [ownedRows, visibility, devPhase, onlyOfficial, query, sortId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / STUDIO_PROJECTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * STUDIO_PROJECTS_PAGE_SIZE,
    safePage * STUDIO_PROJECTS_PAGE_SIZE,
  );

  if (!hydrated || !dataReady) {
    return <PageLoadingSkeleton lines={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">プロジェクト一覧</h1>
          <p className="mt-2 text-sm text-zinc-400">
            あなたの作品を管理し、届いたフィードバックをもとに改善を進められます。
          </p>
        </div>
        <Link
          href={studioSubmitModalHref()}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          <Plus className="size-4" aria-hidden="true" />
          新しい作品を投稿
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="作品名で検索"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StudioInlineSelect
              label="並び替え"
              value={sortId}
              options={[...studioSortOptions]}
              onChange={(id) => setSortId(id as StudioSortId)}
            />
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:gap-6">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-zinc-500">公開状態</p>
              <StudioFilterPills
                options={[...STUDIO_VISIBILITY_FILTER_OPTIONS]}
                active={visibility}
                onChange={(id) => {
                  setVisibility(id);
                  setPage(1);
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-zinc-500">開発フェーズ</p>
              <StudioFilterPills
                options={[...STUDIO_DEV_PHASE_FILTER_OPTIONS]}
                active={devPhase}
                onChange={(id) => {
                  setDevPhase(id);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={onlyOfficial}
              onChange={(event) => {
                setOnlyOfficial(event.target.checked);
                setPage(1);
              }}
              className="size-4 rounded border-zinc-600 bg-zinc-900 text-violet-600 focus:ring-violet-500/40"
            />
            正式版公開済みのみ
          </label>
        </div>
      </div>

      <p className="text-sm text-zinc-500">
        全 <span className="font-medium text-zinc-300">{filtered.length}</span> 件のプロジェクト
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">該当する作品がありません</p>
          <div className="mt-6 flex justify-center">
            <NewProjectCard compact />
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pageItems.map((row) => (
            <OwnedProjectGridCard
              key={row.game.id}
              row={row}
              onDelete={requestDelete}
              showDelete={row.showDelete}
            />
          ))}
          {safePage === totalPages && <NewProjectCard />}
        </div>
      ) : (
        <div className="space-y-3">
          {pageItems.map((row) => (
            <OwnedProjectListRow
              key={row.game.id}
              row={row}
              onDelete={requestDelete}
              showDelete={row.showDelete}
            />
          ))}
          {safePage === totalPages && <NewProjectCard compact />}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-2 pt-2"
          aria-label="ページネーション"
        >
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition-colors hover:border-zinc-700 disabled:opacity-40"
            aria-label="前のページ"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`min-w-9 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                n === safePage
                  ? "bg-violet-600/20 font-medium text-violet-200 ring-1 ring-violet-500/30"
                  : "border border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition-colors hover:border-zinc-700 disabled:opacity-40"
            aria-label="次のページ"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}

      {modal}
    </div>
  );
}
