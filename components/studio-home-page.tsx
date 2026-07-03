"use client";

/** Studio ホーム `/studio` — メインコンテンツのみ。数値は `/api/studio/home-metrics` のみ使用（サンプル/mock なし） */

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Gamepad2,
  Heart,
  HelpCircle,
  LayoutGrid,
  Loader2,
  MessageSquare,
  PenLine,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { StudioShell } from "@/components/studio-shell";
import {
  StudioHomeChartLegend,
  StudioHomeMultiLineChart,
  StudioHomeStackedBarChart,
} from "@/components/studio-home-charts";
import { useStudioHomeHighlights } from "@/hooks/use-studio-home-highlights";
import { useStudioHomeMetrics } from "@/hooks/use-studio-home-metrics";
import {
  STUDIO_HOME_DEV_HINTS,
  STUDIO_HOME_GRANULARITY_OPTIONS,
  STUDIO_HOME_QUICK_LINKS,
  formatStudioHomePeriodFooterLabel,
  latestStudioHomePlayDepth,
  latestStudioHomeVoiceFunnel,
  latestStudioHomeWitnessCommunity,
  shouldRenderStudioHomeCharts,
  voiceDeliveryRatePercent,
  type StudioHomeGranularity,
} from "@/lib/studio-home-metrics";

const PLAY_DEPTH_COLORS = {
  once: "#a855f7",
  twice: "#3b82f6",
  thricePlus: "#22d3ee",
};

const FEEDBACK_DEPTH_COLORS = {
  played: "#a855f7",
  voiced: "#22d3ee",
  deep: "#34d399",
};

const WITNESS_COLORS = {
  watching: "#f97316",
  communityMembers: "#fb7185",
};

type CardAccent = "violet" | "sky" | "orange";

const CARD_ACCENT_STYLES: Record<
  CardAccent,
  {
    orb: string;
    border: string;
    iconBg: string;
    icon: string;
    hover: string;
  }
> = {
  violet: {
    orb: "bg-violet-500/25",
    border: "border-violet-500/15",
    iconBg: "bg-violet-500/15 border-violet-500/25",
    icon: "text-violet-300",
    hover: "hover:border-violet-500/30 hover:shadow-violet-500/10",
  },
  sky: {
    orb: "bg-sky-500/20",
    border: "border-sky-500/15",
    iconBg: "bg-sky-500/15 border-sky-500/25",
    icon: "text-sky-300",
    hover: "hover:border-sky-500/30 hover:shadow-sky-500/10",
  },
  orange: {
    orb: "bg-orange-500/20",
    border: "border-orange-500/15",
    iconBg: "bg-orange-500/15 border-orange-500/25",
    icon: "text-orange-300",
    hover: "hover:border-orange-500/30 hover:shadow-orange-500/10",
  },
};

const QUICK_LINK_STYLES: Record<
  string,
  { icon: LucideIcon; iconBg: string; iconColor: string }
> = {
  "/studio/mypage": {
    icon: LayoutGrid,
    iconBg: "bg-violet-500/15 border-violet-500/25",
    iconColor: "text-violet-300",
  },
  "/studio/submit": {
    icon: PenLine,
    iconBg: "bg-sky-500/15 border-sky-500/25",
    iconColor: "text-sky-300",
  },
  "/studio/community": {
    icon: Users,
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    iconColor: "text-emerald-300",
  },
  "/studio/guide": {
    icon: BookOpen,
    iconBg: "bg-indigo-500/15 border-indigo-500/25",
    iconColor: "text-indigo-300",
  },
};

const DEV_HINT_ICONS = [HelpCircle, FileText, TrendingUp] as const;

const FOOTER_ROW_GRID =
  "grid grid-cols-[1rem_minmax(0,1fr)_3rem] items-center gap-x-2 text-sm leading-tight";

function MetricDot({ color }: { color: string }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function FooterBreakdownRow({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={FOOTER_ROW_GRID}>
      {color ? <MetricDot color={color} /> : <span className="size-2 shrink-0" aria-hidden="true" />}
      <span className="text-zinc-400">{label}</span>
      <span className="text-right font-semibold tabular-nums text-zinc-200">{value}</span>
    </div>
  );
}

function FooterStatRow({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className={FOOTER_ROW_GRID}>
      <Icon className={`size-3.5 shrink-0 ${iconClass}`} aria-hidden="true" />
      <span className="text-zinc-400">{label}</span>
      <span className="text-right font-semibold tabular-nums text-zinc-200">{value}</span>
    </div>
  );
}

function CardFooterSectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-1 text-xs leading-none text-zinc-500">{children}</p>;
}

function CardFooterWithHighlight({
  label,
  highlightLabel,
  highlightValue,
  highlightSuffix,
  highlightClassName,
  children,
}: {
  label: string;
  highlightLabel: string;
  highlightValue: string;
  highlightSuffix?: string;
  highlightClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4">
      <div className="min-w-0">
        <CardFooterSectionLabel>{label}</CardFooterSectionLabel>
        <div className="space-y-1">{children}</div>
      </div>
      <div className="shrink-0 text-right leading-tight">
        <p className="text-xs text-zinc-500">{highlightLabel}</p>
        <p className={`text-2xl font-bold tabular-nums ${highlightClassName}`}>
          {highlightValue}
          {highlightSuffix ? (
            <span className="ml-0.5 text-base font-semibold">{highlightSuffix}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function CardFooterList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <CardFooterSectionLabel>{label}</CardFooterSectionLabel>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function PeriodGranularitySelect({
  value,
  onChange,
}: {
  value: StudioHomeGranularity;
  onChange: (value: StudioHomeGranularity) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    STUDIO_HOME_GRANULARITY_OPTIONS.find((option) => option.id === value) ??
    STUDIO_HOME_GRANULARITY_OPTIONS[2]!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-2 text-sm text-zinc-300 shadow-sm backdrop-blur-sm transition-colors hover:border-zinc-600"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Calendar className="size-4 text-zinc-500" aria-hidden="true" />
        {selected.label}
        <ChevronDown className="size-4 text-zinc-500" aria-hidden="true" />
      </button>
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
            className="absolute right-0 z-30 mt-1 min-w-[12.5rem] rounded-xl border border-zinc-800 bg-zinc-950 py-1 shadow-xl"
          >
            {STUDIO_HOME_GRANULARITY_OPTIONS.map((option) => (
              <li key={option.id} role="option" aria-selected={option.id === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={`block w-full px-3.5 py-2 text-left text-sm transition-colors hover:bg-zinc-900 ${
                    option.id === value ? "text-violet-200" : "text-zinc-300"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ChartFetchingOverlay({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-950/35 backdrop-blur-[1px]"
      aria-hidden="true"
    >
      <Loader2 className="size-5 animate-spin text-zinc-400" />
    </div>
  );
}

function ConnectionChartCard({
  title,
  description,
  accent,
  icon: Icon,
  fetching = false,
  children,
  footer,
}: {
  title: string;
  description: string;
  accent: CardAccent;
  icon: LucideIcon;
  fetching?: boolean;
  children: ReactNode;
  footer: ReactNode;
}) {
  const styles = CARD_ACCENT_STYLES[accent];

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-5 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 sm:p-6 ${styles.border} ${styles.hover}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 size-32 rounded-full blur-3xl ${styles.orb}`}
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg}`}
        >
          <Icon className={`size-5 ${styles.icon}`} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-zinc-50">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>
      <div
        className={`relative mt-4 shrink-0 rounded-xl border border-white/[0.04] bg-black/25 px-2 pb-1 pt-2 backdrop-blur-sm transition-opacity duration-200 ${fetching ? "opacity-80" : "opacity-100"}`}
        aria-busy={fetching}
      >
        <ChartFetchingOverlay active={fetching} />
        {children}
      </div>
      <div
        className={`relative mt-2 mt-auto shrink-0 border-t border-white/[0.06] pt-2.5 transition-opacity duration-200 ${fetching ? "opacity-80" : "opacity-100"}`}
      >
        {footer}
      </div>
    </article>
  );
}

function ConnectionMetricsSection({
  initialLoading,
  fetching,
  rpcReady,
  granularityFallback,
  granularity,
  onGranularityChange,
  metrics,
}: {
  initialLoading: boolean;
  fetching: boolean;
  rpcReady: boolean;
  granularityFallback: boolean;
  granularity: StudioHomeGranularity;
  onGranularityChange: (value: StudioHomeGranularity) => void;
  metrics: ReturnType<typeof useStudioHomeMetrics>["metrics"];
}) {
  const showCharts = shouldRenderStudioHomeCharts(metrics, rpcReady);
  const hasStaleChartData = metrics.months.length > 0;
  const displayCharts = showCharts || (fetching && hasStaleChartData);
  const playDepth = latestStudioHomePlayDepth(metrics);
  const voiceFunnel = latestStudioHomeVoiceFunnel(metrics);
  const witness = latestStudioHomeWitnessCommunity(metrics);
  const feedbackRate = voiceDeliveryRatePercent(voiceFunnel.voiced, voiceFunnel.played);
  const latestPeriodKey = metrics.months.at(-1) ?? "";
  const breakdownLabel = formatStudioHomePeriodFooterLabel(
    latestPeriodKey,
    granularity,
    "breakdown",
  );
  const currentLabel = formatStudioHomePeriodFooterLabel(latestPeriodKey, granularity, "current");
  const witnessLabel = formatStudioHomePeriodFooterLabel(latestPeriodKey, granularity, "witness");

  return (
    <section aria-busy={fetching}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Studio ホーム</h1>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-5 text-violet-400" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">あなたの作品とプレイヤーのつながり</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              公開中の作品全体を合算した、プレイヤーとの関係性の推移です
            </p>
          </div>
        </div>
        <PeriodGranularitySelect value={granularity} onChange={onGranularityChange} />
      </div>

      {granularityFallback && (
        <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          日次・週次の集計にはマイグレーション 037 の適用が必要です。いまは月次データを表示しています。
        </p>
      )}

      {!rpcReady && !initialLoading && (
        <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          集計用のデータベース設定が未適用のため、グラフは空の状態です。マイグレーション
          036 を適用すると表示されます。
        </p>
      )}

      {initialLoading ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-3" aria-label="プレイヤーとのつながりを読み込み中">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-[380px] animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
            />
          ))}
        </div>
      ) : !displayCharts ? (
        <div className="mt-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">
            まだプレイヤーとのつながりは集計されていません。
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            作品が遊ばれると、ここに推移が表示されます。
          </p>
        </div>
      ) : (
        <div
          className="mt-6 grid items-stretch gap-5 xl:grid-cols-3"
          data-studio-metrics-source="api"
          data-studio-metrics-months={metrics.months.join(",")}
          data-studio-metrics-granularity={granularity}
        >
          <ConnectionChartCard
            accent="violet"
            icon={Gamepad2}
            fetching={fetching}
            title="プレイの深さ"
            description="何回遊んでくれたかの内訳"
            footer={
              <CardFooterWithHighlight
                label={breakdownLabel}
                highlightLabel="合計"
                highlightValue={String(playDepth.total)}
                highlightSuffix="人"
                highlightClassName="text-violet-300"
              >
                <FooterBreakdownRow
                  color={PLAY_DEPTH_COLORS.once}
                  label="1回だけ"
                  value={`${playDepth.once}人`}
                />
                <FooterBreakdownRow
                  color={PLAY_DEPTH_COLORS.twice}
                  label="2回"
                  value={`${playDepth.twice}人`}
                />
                <FooterBreakdownRow
                  color={PLAY_DEPTH_COLORS.thricePlus}
                  label="3回以上"
                  value={`${playDepth.thricePlus}人`}
                />
              </CardFooterWithHighlight>
            }
          >
            <StudioHomeStackedBarChart
              periods={metrics.months}
              granularity={granularity}
              series={[
                {
                  key: "once",
                  label: "1回だけ",
                  values: metrics.playDepth.map((point) => point.once),
                  color: PLAY_DEPTH_COLORS.once,
                },
                {
                  key: "twice",
                  label: "2回",
                  values: metrics.playDepth.map((point) => point.twice),
                  color: PLAY_DEPTH_COLORS.twice,
                },
                {
                  key: "thricePlus",
                  label: "3回以上",
                  values: metrics.playDepth.map((point) => point.thricePlus),
                  color: PLAY_DEPTH_COLORS.thricePlus,
                },
              ]}
            />
            <StudioHomeChartLegend
              items={[
                { label: "1回だけ", color: PLAY_DEPTH_COLORS.once },
                { label: "2回", color: PLAY_DEPTH_COLORS.twice },
                { label: "3回以上", color: PLAY_DEPTH_COLORS.thricePlus },
              ]}
            />
          </ConnectionChartCard>

          <ConnectionChartCard
            accent="sky"
            icon={MessageSquare}
            fetching={fetching}
            title="フィードバックの深さ"
            description="遊んだ人のうち、どこまで反応してくれたか"
            footer={
              <CardFooterWithHighlight
                label={currentLabel}
                highlightLabel="フィードバック率"
                highlightValue={feedbackRate === null ? "—" : `${feedbackRate}%`}
                highlightClassName="text-cyan-300"
              >
                <FooterBreakdownRow
                  color={FEEDBACK_DEPTH_COLORS.played}
                  label="遊んだ人"
                  value={`${voiceFunnel.played}人`}
                />
                <FooterBreakdownRow
                  color={FEEDBACK_DEPTH_COLORS.voiced}
                  label="初回フィードバック"
                  value={`${voiceFunnel.voiced}人`}
                />
                <FooterBreakdownRow
                  color={FEEDBACK_DEPTH_COLORS.deep}
                  label="追加フィードバック"
                  value={`${voiceFunnel.deep}人`}
                />
              </CardFooterWithHighlight>
            }
          >
            <StudioHomeMultiLineChart
              periods={metrics.months}
              granularity={granularity}
              fillAreas
              series={[
                {
                  key: "played",
                  label: "遊んだ人",
                  values: metrics.voiceFunnel.map((point) => point.played),
                  color: FEEDBACK_DEPTH_COLORS.played,
                },
                {
                  key: "voiced",
                  label: "初回フィードバック",
                  values: metrics.voiceFunnel.map((point) => point.voiced),
                  color: FEEDBACK_DEPTH_COLORS.voiced,
                },
                {
                  key: "deep",
                  label: "追加フィードバック",
                  values: metrics.voiceFunnel.map((point) => point.deep),
                  color: FEEDBACK_DEPTH_COLORS.deep,
                },
              ]}
            />
            <StudioHomeChartLegend
              items={[
                { label: "遊んだ人", color: FEEDBACK_DEPTH_COLORS.played },
                { label: "初回フィードバック", color: FEEDBACK_DEPTH_COLORS.voiced },
                { label: "追加フィードバック", color: FEEDBACK_DEPTH_COLORS.deep },
              ]}
            />
          </ConnectionChartCard>

          <ConnectionChartCard
            accent="orange"
            icon={Heart}
            fetching={fetching}
            title="見届けの広がり"
            description="プレイ後も作品を追いかけてくれた人の推移"
            footer={
              <CardFooterList label={witnessLabel}>
                <FooterStatRow
                  icon={Heart}
                  iconClass="text-orange-400"
                  label="見届けている人"
                  value={`${witness.watching}人`}
                />
                <FooterStatRow
                  icon={Users}
                  iconClass="text-rose-400"
                  label="コミュニティ参加者"
                  value={`${witness.communityMembers}人`}
                />
              </CardFooterList>
            }
          >
            <StudioHomeMultiLineChart
              periods={metrics.months}
              granularity={granularity}
              fillAreas
              series={[
                {
                  key: "watching",
                  label: "見届けている人",
                  values: metrics.witnessCommunity.map((point) => point.watching),
                  color: WITNESS_COLORS.watching,
                },
                {
                  key: "communityMembers",
                  label: "コミュニティ参加者",
                  values: metrics.witnessCommunity.map((point) => point.communityMembers),
                  color: WITNESS_COLORS.communityMembers,
                },
              ]}
            />
            <StudioHomeChartLegend
              items={[
                { label: "見届けている人", color: WITNESS_COLORS.watching },
                { label: "コミュニティ参加者", color: WITNESS_COLORS.communityMembers },
              ]}
            />
          </ConnectionChartCard>
        </div>
      )}
    </section>
  );
}

function HighlightsSection({
  unreadVoiceProjectCount,
  hasRecentCommunityReply,
  loading,
}: {
  unreadVoiceProjectCount: number;
  hasRecentCommunityReply: boolean;
  loading: boolean;
}) {
  const showUnread = !loading && unreadVoiceProjectCount > 0;
  const showCommunity = !loading && hasRecentCommunityReply;

  if (!showUnread && !showCommunity) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-4 text-violet-400" aria-hidden="true" />
        <h2 className="text-base font-semibold text-zinc-100">気になる動き</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {showUnread && (
          <Link
            href="/studio/mypage"
            className="group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-zinc-950/50 to-zinc-950/80 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/35 hover:shadow-lg hover:shadow-violet-500/10"
          >
            <ArrowUpRight
              className="absolute right-4 top-4 size-4 text-zinc-600 transition-colors group-hover:text-violet-400"
              aria-hidden="true"
            />
            <div className="flex items-start gap-3 pr-8">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15">
                <MessageSquare className="size-5 text-violet-300" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-zinc-100">未確認のフィードバックがあります</p>
                <p className="mt-1 text-sm text-zinc-500">新しく届いた反応を確認できます</p>
                <span className="mt-3 inline-block text-sm font-medium text-violet-300 group-hover:text-violet-200">
                  作品一覧へ →
                </span>
              </div>
            </div>
          </Link>
        )}
        {showCommunity && (
          <Link
            href="/studio/community"
            className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-zinc-950/50 to-zinc-950/80 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/35 hover:shadow-lg hover:shadow-orange-500/10"
          >
            <ArrowUpRight
              className="absolute right-4 top-4 size-4 text-zinc-600 transition-colors group-hover:text-orange-400"
              aria-hidden="true"
            />
            <div className="flex items-start gap-3 pr-8">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/15">
                <MessageSquare className="size-5 text-orange-300" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-zinc-100">コミュニティに新しい反応があります</p>
                <p className="mt-1 text-sm text-zinc-500">コミュニティで新しい返信がありました</p>
                <span className="mt-3 inline-block text-sm font-medium text-orange-300 group-hover:text-orange-200">
                  コミュニティへ →
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}

function QuickAccessSection() {
  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 p-4 backdrop-blur-md">
      <h2 className="text-base font-semibold text-zinc-100">クイックアクセス</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {STUDIO_HOME_QUICK_LINKS.map((link) => {
          const style = QUICK_LINK_STYLES[link.href] ?? QUICK_LINK_STYLES["/studio/mypage"]!;
          const Icon = style.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group relative flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-zinc-950/50 px-3 py-2.5 transition-all duration-300 hover:border-white/10 hover:bg-zinc-900/60"
              >
                <ArrowUpRight
                  className="absolute right-2 top-2 size-3 text-zinc-600 transition-colors group-hover:text-zinc-400"
                  aria-hidden="true"
                />
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${style.iconBg}`}
                >
                  <Icon className={`size-4 ${style.iconColor}`} aria-hidden="true" />
                </span>
                <span className="pr-4 text-sm font-medium text-zinc-300 group-hover:text-zinc-100">
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DevHintsSection() {
  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-100">開発のヒント</h2>
        <Link
          href="/studio/guide"
          className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          すべて見る →
        </Link>
      </div>
      <ul className="mt-2 divide-y divide-white/[0.04]">
        {STUDIO_HOME_DEV_HINTS.map((hint, index) => {
          const Icon = DEV_HINT_ICONS[index] ?? HelpCircle;
          return (
            <li key={hint.id}>
              <Link
                href={hint.href}
                className="group flex items-center gap-2.5 py-2.5 transition-colors"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 group-hover:text-violet-300">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm text-zinc-400 group-hover:text-zinc-200">
                  {hint.title}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-zinc-600 group-hover:text-zinc-400"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function StudioHomePage() {
  const [granularity, setGranularity] = useState<StudioHomeGranularity>("month");
  const { metrics, initialLoading, fetching, rpcReady, granularityFallback } =
    useStudioHomeMetrics(granularity);
  const { highlights, loading: highlightsLoading } = useStudioHomeHighlights();

  return (
    <StudioShell activeNav="home">
      <div className="mx-auto max-w-7xl space-y-8 pb-6">
        <ConnectionMetricsSection
          initialLoading={initialLoading}
          fetching={fetching}
          rpcReady={rpcReady}
          granularityFallback={granularityFallback}
          granularity={granularity}
          onGranularityChange={setGranularity}
          metrics={metrics}
        />

        <HighlightsSection
          unreadVoiceProjectCount={highlights.unreadVoiceProjectCount}
          hasRecentCommunityReply={highlights.hasRecentCommunityReply}
          loading={highlightsLoading}
        />

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <QuickAccessSection />
          <DevHintsSection />
        </div>
      </div>
    </StudioShell>
  );
}
