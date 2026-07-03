"use client";

/** Studio ホーム `/studio` — メインコンテンツのみ。数値は `/api/studio/home-metrics` のみ使用（サンプル/mock なし） */

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  PenLine,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
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
  STUDIO_HOME_QUICK_LINKS,
  formatStudioHomeMonthLabel,
  isWitnessSpreadEmpty,
  latestStudioHomePlayDepth,
  latestStudioHomeVoiceFunnel,
  latestStudioHomeWitnessCommunity,
  shouldRenderStudioHomeCharts,
  voiceDeliveryRatePercent,
} from "@/lib/studio-home-metrics";

const PLAY_DEPTH_COLORS = {
  once: "#8b5cf6",
  twice: "#f97316",
  thricePlus: "#fbbf24",
};

const FEEDBACK_DEPTH_COLORS = {
  played: "#38bdf8",
  voiced: "#a78bfa",
  deep: "#fb923c",
};

const WITNESS_COLORS = {
  watching: "#f97316",
  communityMembers: "#818cf8",
};

type CardAccent = "violet" | "sky" | "orange";

const CARD_ACCENT_STYLES: Record<
  CardAccent,
  { orb: string; border: string; icon: string; hover: string }
> = {
  violet: {
    orb: "bg-violet-500/20",
    border: "border-violet-500/20",
    icon: "text-violet-300",
    hover: "hover:border-violet-500/35 hover:shadow-violet-500/10",
  },
  sky: {
    orb: "bg-sky-500/15",
    border: "border-sky-500/20",
    icon: "text-sky-300",
    hover: "hover:border-sky-500/35 hover:shadow-sky-500/10",
  },
  orange: {
    orb: "bg-orange-500/15",
    border: "border-orange-500/20",
    icon: "text-orange-300",
    hover: "hover:border-orange-500/35 hover:shadow-orange-500/10",
  },
};

const QUICK_LINK_ICONS: Record<string, LucideIcon> = {
  "/studio/mypage": LayoutGrid,
  "/studio/submit": PenLine,
  "/studio/community": Users,
  "/studio/guide": BookOpen,
};

function MetricSummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        emphasis ? "border-t border-white/[0.06] pt-2.5" : ""
      }`}
    >
      <span
        className={
          emphasis ? "text-sm font-medium text-zinc-400" : "text-sm text-zinc-500"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasis
            ? "text-lg font-bold tabular-nums text-white"
            : "text-sm font-semibold tabular-nums text-zinc-200"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ChartHeadline({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent px-4 py-3.5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-zinc-50">{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function LowDataHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 text-xs leading-relaxed text-zinc-500">
      {children}
    </p>
  );
}

function ConnectionChartCard({
  title,
  description,
  accent,
  headline,
  children,
  summary,
  footerNote,
}: {
  title: string;
  description: string;
  accent: CardAccent;
  headline: ReactNode;
  children: ReactNode;
  summary: ReactNode;
  footerNote?: ReactNode;
}) {
  const styles = CARD_ACCENT_STYLES[accent];

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-900/90 via-zinc-900/55 to-zinc-950/90 p-5 shadow-xl shadow-black/25 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 sm:p-6 ${styles.border} ${styles.hover}`}
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 size-36 rounded-full blur-3xl ${styles.orb}`}
        aria-hidden="true"
      />
      <div className="relative">
        <h3 className="text-base font-semibold tracking-tight text-zinc-50">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
      <div className="relative mt-4">{headline}</div>
      <div className="relative mt-3 min-h-[200px] flex-1">{children}</div>
      {footerNote}
      <div className="relative mt-4 space-y-2 rounded-xl border border-white/[0.05] bg-black/20 p-4 backdrop-blur-sm">
        {summary}
      </div>
    </article>
  );
}

function ConnectionMetricsSection({
  loading,
  rpcReady,
  metrics,
}: {
  loading: boolean;
  rpcReady: boolean;
  metrics: ReturnType<typeof useStudioHomeMetrics>["metrics"];
}) {
  const showCharts = shouldRenderStudioHomeCharts(metrics, rpcReady);
  const playDepth = latestStudioHomePlayDepth(metrics);
  const voiceFunnel = latestStudioHomeVoiceFunnel(metrics);
  const witness = latestStudioHomeWitnessCommunity(metrics);
  const witnessEmpty = isWitnessSpreadEmpty(metrics);
  const feedbackRate = voiceDeliveryRatePercent(voiceFunnel.voiced, voiceFunnel.played);
  const monthLabels = metrics.months.map(formatStudioHomeMonthLabel);
  const latestMonthLabel =
    monthLabels[monthLabels.length - 1] ?? formatStudioHomeMonthLabel(metrics.months.at(-1) ?? "");

  if (loading) {
    return (
      <section aria-busy="true" aria-label="プレイヤーとのつながりを読み込み中">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-9 w-64 rounded-lg bg-zinc-800/80" />
          <div className="h-9 w-28 rounded-full bg-zinc-800/80" />
        </div>
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-[420px] animate-pulse rounded-2xl border border-zinc-800/80 bg-zinc-900/40"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 shadow-lg shadow-violet-500/10">
              <Sparkles className="size-4 text-violet-300" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
              あなたの作品とプレイヤーのつながり
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            公開中の作品全体を合算した、プレイヤーとの関係性の推移です。
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-4 py-2 text-xs font-semibold text-violet-200 shadow-sm shadow-violet-500/10">
          直近6か月
        </span>
      </div>

      {!rpcReady && (
        <p className="mt-5 rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-3 text-sm text-amber-100/90">
          集計用のデータベース設定が未適用のため、グラフは空の状態です。マイグレーション
          036 を適用すると表示されます。
        </p>
      )}

      {!showCharts ? (
        <div className="mt-8 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 px-6 py-12 text-center shadow-inner">
          <p className="text-sm text-zinc-400">
            まだプレイヤーとのつながりは集計されていません。
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            作品が遊ばれると、ここに推移が表示されます。
          </p>
        </div>
      ) : (
        <div
          className="mt-8 grid gap-5 xl:grid-cols-3"
          data-studio-metrics-source="api"
          data-studio-metrics-months={metrics.months.join(",")}
        >
          <ConnectionChartCard
            accent="violet"
            title="プレイの深さ"
            description="公開作品を遊んだユニークプレイヤーの内訳です。"
            headline={
              <ChartHeadline
                label={latestMonthLabel ? `${latestMonthLabel}のプレイヤー` : "直近月のプレイヤー"}
                value={`${playDepth.total}人`}
                hint={
                  playDepth.total > 0
                    ? `1回 ${playDepth.once}人 · 2回 ${playDepth.twice}人 · 3回以上 ${playDepth.thricePlus}人`
                    : "この月はまだプレイがありません"
                }
              />
            }
            summary={
              <>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                  {latestMonthLabel ? `${latestMonthLabel}の内訳` : "直近月の内訳"}
                </p>
                <MetricSummaryRow label="1回だけ" value={`${playDepth.once}人`} />
                <MetricSummaryRow label="2回" value={`${playDepth.twice}人`} />
                <MetricSummaryRow label="3回以上" value={`${playDepth.thricePlus}人`} />
                <MetricSummaryRow
                  label="プレイヤー合計"
                  value={`${playDepth.total}人`}
                  emphasis
                />
              </>
            }
          >
            <StudioHomeStackedBarChart
              months={metrics.months}
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
            title="フィードバックの深さ"
            description="プレイした人のうち、どこまでフィードバックを届けてくれたかの推移です。"
            headline={
              <ChartHeadline
                label={latestMonthLabel ? `${latestMonthLabel}の遊んだ人` : "直近月の遊んだ人"}
                value={`${voiceFunnel.played}人`}
                hint={
                  voiceFunnel.played > 0
                    ? `初回フィードバック ${voiceFunnel.voiced}人 · 追加 ${voiceFunnel.deep}人`
                    : "この月はまだプレイがありません"
                }
              />
            }
            summary={
              <>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                  {latestMonthLabel ? `${latestMonthLabel}の現在値` : "直近月の現在値"}
                </p>
                <MetricSummaryRow label="遊んだ人" value={`${voiceFunnel.played}人`} />
                <MetricSummaryRow
                  label="初回フィードバック"
                  value={`${voiceFunnel.voiced}人`}
                />
                <MetricSummaryRow
                  label="追加フィードバック"
                  value={`${voiceFunnel.deep}人`}
                />
                <MetricSummaryRow
                  label="初回フィードバックの割合"
                  value={feedbackRate === null ? "—" : `${feedbackRate}%`}
                  emphasis
                />
              </>
            }
          >
            <StudioHomeMultiLineChart
              months={metrics.months}
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
            title="見届けの広がり"
            description="プレイ後も作品と関係を持ち続けてくれているプレイヤーの推移です。"
            headline={
              <ChartHeadline
                label={latestMonthLabel ? `${latestMonthLabel}末` : "直近月末"}
                value={`見届け ${witness.watching}人`}
                hint={`コミュニティ参加者 ${witness.communityMembers}人`}
              />
            }
            footerNote={
              witnessEmpty ? (
                <LowDataHint>
                  まだ見届け・コミュニティ参加はありません。見届けやコミュニティ参加が増えると、ここに推移が表示されます。
                </LowDataHint>
              ) : null
            }
            summary={
              <>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                  {latestMonthLabel ? `${latestMonthLabel}末の目安` : "直近月の目安"}
                </p>
                <MetricSummaryRow label="見届けている人" value={`${witness.watching}人`} />
                <MetricSummaryRow
                  label="コミュニティ参加者"
                  value={`${witness.communityMembers}人`}
                  emphasis
                />
              </>
            }
          >
            <StudioHomeMultiLineChart
              months={metrics.months}
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
    <section className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/70 to-zinc-950/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        気になる動き
      </h2>
      <div className="mt-4 space-y-3">
        {showUnread && (
          <div className="group rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-zinc-950/40 to-zinc-950/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/35 hover:shadow-lg hover:shadow-orange-500/10">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/15">
                <MessageSquare className="size-4 text-orange-300" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-100">
                  未確認のフィードバックがあります
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  新しく届いた反応を確認できます
                </p>
                <Link
                  href="/studio/mypage"
                  className="mt-3 inline-flex items-center gap-1 rounded-lg border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-200 transition-colors hover:bg-orange-500/15"
                >
                  作品一覧へ
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        )}
        {showCommunity && (
          <div className="group rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-zinc-950/40 to-zinc-950/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/35 hover:shadow-lg hover:shadow-violet-500/10">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/15">
                <Users className="size-4 text-violet-300" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-100">
                  コミュニティに新しい反応があります
                </p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  コミュニティで新しい返信がありました
                </p>
                <Link
                  href="/studio/community"
                  className="mt-3 inline-flex items-center gap-1 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/15"
                >
                  コミュニティへ
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function QuickAccessSection() {
  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/70 to-zinc-950/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md sm:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        クイックアクセス
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {STUDIO_HOME_QUICK_LINKS.map((link) => {
          const Icon = QUICK_LINK_ICONS[link.href] ?? LayoutGrid;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-zinc-950/50 px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-violet-500/5 hover:shadow-lg hover:shadow-violet-500/10"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 text-violet-300 transition-colors group-hover:border-violet-500/35 group-hover:text-violet-200">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
                  {link.label}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-violet-400"
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

function DevHintsSection() {
  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 p-5 shadow-lg shadow-black/15 backdrop-blur-md sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
            <Lightbulb className="size-4 text-amber-300" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-zinc-100">開発のヒント</h2>
        </div>
        <Link
          href="/studio/guide"
          className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          ガイドへ →
        </Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {STUDIO_HOME_DEV_HINTS.map((hint) => (
          <li key={hint.id}>
            <Link
              href={hint.href}
              className="group flex h-full flex-col rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/25 hover:shadow-lg hover:shadow-amber-500/5"
            >
              <p className="text-sm font-medium leading-snug text-zinc-200 group-hover:text-zinc-50">
                {hint.title}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 group-hover:text-amber-300/90">
                読む
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StudioHomePage() {
  const { metrics, loading, rpcReady } = useStudioHomeMetrics();
  const { highlights, loading: highlightsLoading } = useStudioHomeHighlights();

  return (
    <StudioShell activeNav="home">
      <div className="mx-auto max-w-7xl space-y-8 pb-4">
        <ConnectionMetricsSection loading={loading} rpcReady={rpcReady} metrics={metrics} />

        <div className="grid gap-5 lg:grid-cols-2">
          <HighlightsSection
            unreadVoiceProjectCount={highlights.unreadVoiceProjectCount}
            hasRecentCommunityReply={highlights.hasRecentCommunityReply}
            loading={highlightsLoading}
          />
          <QuickAccessSection />
        </div>

        <DevHintsSection />
      </div>
    </StudioShell>
  );
}
