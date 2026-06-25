"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  aiSummaryBullets,
  freeTextThemes,
  getCommunityVoicesForGame,
  questionAggregates,
  voiceFilters,
  voiceStatsCards,
  voiceSubTabs,
  voiceVersionFilters,
  type CommunityVoiceEntry,
  type VoiceSubTabId,
  type VoiceVersionFilterId,
} from "@/lib/game-voices-v0-mock-data";
import { BarChart3, ChevronDown, Heart, Lightbulb } from "lucide-react";

const VOICES_INITIAL_SHOWN = 5;

function StatCard({ label, value, delta, hint }: (typeof voiceStatsCards)[number]) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-emerald-400/90">{delta}</p>
      {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function KindBadge({ kind, label }: { kind: CommunityVoiceEntry["kind"]; label: string }) {
  const className =
    kind === "free"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : "border-sky-500/30 bg-sky-500/10 text-sky-300";
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function VoiceCard({
  voice,
  onToggleEmpathy,
}: {
  voice: CommunityVoiceEntry;
  onToggleEmpathy: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-zinc-800">
          <Image src={voice.avatar} alt="" fill className="object-cover" />
        </span>
        <div>
          <KindBadge kind={voice.kind} label={voice.kindLabel} />
          <p className="mt-1 text-xs text-zinc-500">
            {voice.version} · {voice.postedAt}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{voice.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {voice.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-zinc-800/80 pt-4">
        <button
          type="button"
          onClick={() => onToggleEmpathy(voice.id)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            voice.empathized
              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          <Heart className="size-3.5" aria-hidden="true" />
          共感 {voice.empathyCount + (voice.empathized ? 1 : 0)}
        </button>
      </div>
    </article>
  );
}

function AggregateBar({ aggregate }: { aggregate: (typeof questionAggregates)[number] }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4">
      <p className="text-sm font-medium text-zinc-200">{aggregate.question}</p>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full">
        {aggregate.segments.map((segment) => (
          <div
            key={segment.label}
            className={segment.colorClass}
            style={{ width: `${segment.percent}%` }}
            title={`${segment.label} ${segment.percent}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {aggregate.segments.map((segment) => (
          <span key={segment.label} className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`size-2 rounded-full ${segment.colorClass}`} />
            {segment.label} {segment.percent}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function GameVoicesV0Tab({
  gameId,
  currentVersion,
  onSendVoice,
  refreshKey = 0,
}: {
  gameId: string;
  currentVersion: string;
  onSendVoice?: () => void;
  refreshKey?: number;
}) {
  const [subTab, setSubTab] = useState<VoiceSubTabId>("received");
  const [filter, setFilter] = useState<(typeof voiceFilters)[number]["id"]>("all");
  const [versionFilter, setVersionFilter] = useState<VoiceVersionFilterId>("all");
  const [voices, setVoices] = useState<CommunityVoiceEntry[]>(() =>
    getCommunityVoicesForGame(gameId),
  );
  const [showAllVoices, setShowAllVoices] = useState(false);

  useEffect(() => {
    setVoices(getCommunityVoicesForGame(gameId));
  }, [gameId, refreshKey]);

  useEffect(() => {
    setShowAllVoices(false);
  }, [filter, versionFilter, gameId]);

  const filteredVoices = voices.filter((voice) => {
    if (versionFilter !== "all" && voice.version !== versionFilter) {
      return false;
    }
    if (filter === "all") return true;
    if (filter === "free") return voice.kind === "free";
    return voice.kind === "choice";
  });

  const visibleVoices = showAllVoices
    ? filteredVoices
    : filteredVoices.slice(0, VOICES_INITIAL_SHOWN);
  const hasMoreVoices = filteredVoices.length > VOICES_INITIAL_SHOWN && !showAllVoices;

  function toggleEmpathy(id: string) {
    setVoices((current) =>
      current.map((voice) =>
        voice.id === id ? { ...voice, empathized: !voice.empathized } : voice,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {voiceStatsCards.map((card) => (
            <StatCard key={card.id} {...card} />
          ))}
        </div>

        <div className="border-b border-zinc-800/80">
          <div className="flex gap-1 overflow-x-auto">
            {voiceSubTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  subTab === tab.id
                    ? "border-violet-500 text-violet-200"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {subTab === "received" && (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {voiceFilters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      filter === item.id
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-200"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {item.label} ({item.count})
                  </button>
                ))}
              </div>
              <select
                value={versionFilter}
                onChange={(event) =>
                  setVersionFilter(event.target.value as typeof versionFilter)
                }
                className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              >
                {voiceVersionFilters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <ul className="space-y-4">
              {visibleVoices.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
                  この条件に合うフィードバックはまだありません。
                </li>
              ) : (
                visibleVoices.map((voice) => (
                  <li key={voice.id}>
                    <VoiceCard voice={voice} onToggleEmpathy={toggleEmpathy} />
                  </li>
                ))
              )}
            </ul>

            {filteredVoices.length > 0 && (
            <div className="flex flex-col items-center gap-3 border-t border-zinc-800/80 pt-6">
              <p className="text-xs text-zinc-500">
                {filteredVoices.length}件中 {visibleVoices.length}件を表示
              </p>
              {hasMoreVoices && (
                <button
                  type="button"
                  onClick={() => setShowAllVoices(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                >
                  もっと見る
                  <ChevronDown className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>
            )}
          </>
        )}

        {subTab === "by-question" && (
          <div className="space-y-4">
            {questionAggregates.map((aggregate) => (
              <AggregateBar key={aggregate.id} aggregate={aggregate} />
            ))}
          </div>
        )}

        {subTab === "free-text" && (
          <ul className="space-y-4">
            {freeTextThemes.map((theme) => (
              <li
                key={theme.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{theme.theme}</h3>
                  <span className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-500">
                    {theme.count}件
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{theme.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="w-full shrink-0 space-y-5 xl:w-72">
        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart3 className="size-4 text-violet-400" aria-hidden="true" />
            {currentVersion} のフィードバック要約
          </h2>
          <ul className="mt-4 space-y-3">
            {aiSummaryBullets.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
                <span
                  className={`mt-1 size-1.5 shrink-0 rounded-full ${
                    item.tone === "positive"
                      ? "bg-emerald-400"
                      : item.tone === "improve"
                        ? "bg-orange-400"
                        : "bg-zinc-500"
                  }`}
                />
                {item.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-white">質問別の集計（今月）</h2>
          <div className="mt-4 space-y-4">
            {questionAggregates.slice(0, 1).map((aggregate) => (
              <AggregateBar key={aggregate.id} aggregate={aggregate} />
            ))}
          </div>
        </section>

        {onSendVoice && (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4">
          <div className="flex gap-3">
            <Lightbulb className="size-5 shrink-0 text-violet-400" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-zinc-500">
              あなたのフィードバックも開発の参考になります。プレイ後に送ってみましょう。
            </p>
          </div>
          <button
            type="button"
            onClick={onSendVoice}
            className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            フィードバックする
          </button>
        </section>
        )}
      </aside>
    </div>
  );
}
