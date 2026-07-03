"use client";

import Link from "next/link";
import { ChevronRight, Lightbulb, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { StudioSectionHeader, StudioShell } from "@/components/studio-shell";
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
  hasStudioHomeConnectionData,
  latestStudioHomePlayDepth,
  latestStudioHomeVoiceFunnel,
  latestStudioHomeWitnessCommunity,
  voiceDeliveryRatePercent,
} from "@/lib/studio-home-metrics";

const PLAY_DEPTH_COLORS = {
  once: "#a78bfa",
  twice: "#f97316",
  thricePlus: "#fbbf24",
};

const VOICE_FUNNEL_COLORS = {
  played: "#38bdf8",
  voiced: "#a78bfa",
  deep: "#f97316",
};

const WITNESS_COLORS = {
  watching: "#f97316",
  communityMembers: "#a78bfa",
};

function MetricSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function ConnectionChartCard({
  title,
  description,
  children,
  summary,
}: {
  title: string;
  description: string;
  children: ReactNode;
  summary: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
      <div className="mt-4 min-h-[180px] flex-1">{children}</div>
      <div className="mt-4 space-y-2 border-t border-zinc-800/80 pt-4">{summary}</div>
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
  const hasData = hasStudioHomeConnectionData(metrics);
  const playDepth = latestStudioHomePlayDepth(metrics);
  const voiceFunnel = latestStudioHomeVoiceFunnel(metrics);
  const witness = latestStudioHomeWitnessCommunity(metrics);
  const voiceRate = voiceDeliveryRatePercent(voiceFunnel.voiced, voiceFunnel.played);
  const monthLabels = metrics.months.map(formatStudioHomeMonthLabel);
  const latestMonthLabel =
    monthLabels[monthLabels.length - 1] ?? formatStudioHomeMonthLabel(metrics.months.at(-1) ?? "");

  if (loading) {
    return (
      <section aria-busy="true" aria-label="プレイヤーとのつながりを読み込み中">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-7 w-56 rounded bg-zinc-800/80" />
          <div className="h-8 w-28 rounded-full bg-zinc-800/80" />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="h-[360px] rounded-2xl border border-zinc-800 bg-zinc-900/30"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StudioSectionHeader
            title="あなたの作品とプレイヤーのつながり"
            icon={<Sparkles className="size-5 text-violet-400" aria-hidden="true" />}
          />
          <p className="mt-1 text-sm text-zinc-500">
            公開中の作品全体を合算した、プレイヤーとの関係性の推移です。
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300">
          直近6か月
        </span>
      </div>

      {!rpcReady && (
        <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
          集計用のデータベース設定が未適用のため、グラフは空の状態です。マイグレーション
          036 を適用すると表示されます。
        </p>
      )}

      {!hasData ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 px-5 py-8 text-center">
          <p className="text-sm text-zinc-400">
            まだプレイヤーとのつながりは集計されていません。
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            作品が遊ばれると、ここに推移が表示されます。
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <ConnectionChartCard
            title="遊びの深さ"
            description="公開作品を遊んだユニークプレイヤーの内訳です。"
            summary={
              <>
                <p className="mb-2 text-xs text-zinc-600">
                  {latestMonthLabel ? `${latestMonthLabel}の内訳` : "直近月の内訳"}
                </p>
                <MetricSummaryRow label="1回だけ遊んだ人" value={`${playDepth.once}人`} />
                <MetricSummaryRow label="2回遊んだ人" value={`${playDepth.twice}人`} />
                <MetricSummaryRow label="3回以上遊んだ人" value={`${playDepth.thricePlus}人`} />
                <MetricSummaryRow
                  label="遊んだプレイヤー合計"
                  value={`${playDepth.total}人`}
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
            title="声の届き方"
            description="遊んだ人のうち、どこまで声を届けてくれたかの推移です。"
            summary={
              <>
                <p className="mb-2 text-xs text-zinc-600">
                  {latestMonthLabel ? `${latestMonthLabel}の現在値` : "直近月の現在値"}
                </p>
                <MetricSummaryRow label="遊んだ人" value={`${voiceFunnel.played}人`} />
                <MetricSummaryRow label="声を届けた人" value={`${voiceFunnel.voiced}人`} />
                <MetricSummaryRow
                  label="詳しい改善材料も送った人"
                  value={`${voiceFunnel.deep}人`}
                />
                <MetricSummaryRow
                  label="声を届けた人の割合"
                  value={voiceRate === null ? "—" : `${voiceRate}%`}
                />
              </>
            }
          >
            <StudioHomeMultiLineChart
              months={metrics.months}
              series={[
                {
                  key: "played",
                  label: "遊んだ人",
                  values: metrics.voiceFunnel.map((point) => point.played),
                  color: VOICE_FUNNEL_COLORS.played,
                },
                {
                  key: "voiced",
                  label: "声を届けた人",
                  values: metrics.voiceFunnel.map((point) => point.voiced),
                  color: VOICE_FUNNEL_COLORS.voiced,
                },
                {
                  key: "deep",
                  label: "詳しい改善材料",
                  values: metrics.voiceFunnel.map((point) => point.deep),
                  color: VOICE_FUNNEL_COLORS.deep,
                },
              ]}
            />
            <StudioHomeChartLegend
              items={[
                { label: "遊んだ人", color: VOICE_FUNNEL_COLORS.played },
                { label: "声を届けた人", color: VOICE_FUNNEL_COLORS.voiced },
                { label: "詳しい改善材料", color: VOICE_FUNNEL_COLORS.deep },
              ]}
            />
          </ConnectionChartCard>

          <ConnectionChartCard
            title="見届け・コミュニティ"
            description="プレイ後も作品と関係を持ち続けてくれているプレイヤーの推移です。"
            summary={
              <>
                <p className="mb-2 text-xs text-zinc-600">
                  {latestMonthLabel ? `${latestMonthLabel}末の目安` : "直近月の目安"}
                </p>
                <MetricSummaryRow label="見届けている人" value={`${witness.watching}人`} />
                <MetricSummaryRow
                  label="コミュニティ参加者"
                  value={`${witness.communityMembers}人`}
                />
              </>
            }
          >
            <StudioHomeMultiLineChart
              months={metrics.months}
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
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        気になる動き
      </h2>
      <div className="mt-3 space-y-3">
        {showUnread && (
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5">
            <p className="text-sm font-medium text-zinc-200">未確認の声があります</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {unreadVoiceProjectCount}つの作品に新しい声が届いています
            </p>
            <Link
              href="/studio/mypage"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              作品一覧（マイプロフィール）へ
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
        {showCommunity && (
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5">
            <p className="text-sm font-medium text-zinc-200">
              コミュニティに新しい反応があります
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">新しい返信があります</p>
            <Link
              href="/studio/community"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              コミュニティへ
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function QuickAccessSection() {
  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        クイックアクセス
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {STUDIO_HOME_QUICK_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-violet-500/30 hover:text-violet-200"
            >
              {link.label}
              <ChevronRight className="size-4 text-zinc-600" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DevHintsSection() {
  return (
    <section>
      <StudioSectionHeader
        title="開発のヒント"
        href="/studio/guide"
        icon={<Lightbulb className="size-5 text-violet-400" aria-hidden="true" />}
      />
      <ul className="mt-4 space-y-2">
        {STUDIO_HOME_DEV_HINTS.map((hint) => (
          <li key={hint.id}>
            <Link
              href={hint.href}
              className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-violet-500/25 hover:text-violet-200"
            >
              {hint.title}
              <ChevronRight className="size-4 shrink-0 text-zinc-600" aria-hidden="true" />
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
      <div className="mx-auto max-w-7xl space-y-8">
        <ConnectionMetricsSection loading={loading} rpcReady={rpcReady} metrics={metrics} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
