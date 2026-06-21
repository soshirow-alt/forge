"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  StudioFilterPills,
  StudioProjectTabs,
  StudioShell,
} from "@/components/studio-shell";
import {
  getStudioProjectDetail,
  parseStudioProjectTab,
  studioAggregatedSections,
  studioDeepFeedbacks,
  studioDevlogItems,
  studioFirstVoices,
  studioReleaseState,
  studioVersionItems,
  studioVersionQuestions,
} from "@/lib/studio-project-detail-v0-mock-data";
import { MessageSquare, Users } from "lucide-react";

const voiceFilters = [
  { id: "unread", label: "未確認" },
  { id: "read", label: "確認済" },
  { id: "candidate", label: "採用候補" },
];

function statusLabel(status: string) {
  if (status === "unread") return "未確認";
  if (status === "candidate") return "採用候補";
  return "確認済";
}

function OverviewTab({
  project,
}: {
  project: NonNullable<ReturnType<typeof getStudioProjectDetail>>;
}) {
  return (
    <form className="mx-auto max-w-2xl space-y-5">
      <label className="block">
        <span className="text-sm text-zinc-400">タイトル</span>
        <input
          defaultValue={project.title}
          className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm text-zinc-400">説明</span>
        <textarea
          defaultValue={project.description}
          rows={4}
          className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm text-zinc-400">ジャンル</span>
          <input
            defaultValue={project.genresList.join(" / ")}
            className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-400">フェーズ</span>
          <input
            defaultValue={project.phase}
            className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm text-zinc-400">外部リンク</span>
        <input
          defaultValue={project.externalUrl ?? ""}
          placeholder="https://"
          className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-sm text-zinc-400">公開状態</span>
        <select
          defaultValue={project.publishState}
          className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
        >
          <option>公開中</option>
          <option>非公開</option>
          <option>下書き</option>
        </select>
      </label>
      <button
        type="button"
        className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
      >
        保存
      </button>
    </form>
  );
}

function VoicesRawTab() {
  const [filter, setFilter] = useState("all");
  const firstVoices = studioFirstVoices.filter(
    (v) => filter === "all" || v.status === filter,
  );
  const deepFbs = studioDeepFeedbacks.filter(
    (v) => filter === "all" || v.status === filter,
  );

  return (
    <div className="space-y-8">
      <StudioFilterPills options={voiceFilters} active={filter} onChange={setFilter} />

      <section>
        <h3 className="text-sm font-semibold text-zinc-300">フィードバック一覧</h3>
        <ul className="mt-4 space-y-3">
          {firstVoices.map((voice) => (
            <li
              key={voice.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-zinc-200">{voice.playerName}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">{voice.date}</span>
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-400">
                    {statusLabel(voice.status)}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{voice.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-300">深い FB 一覧</h3>
        <ul className="mt-4 space-y-3">
          {deepFbs.map((fb) => (
            <li
              key={fb.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-zinc-200">{fb.playerName}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">{fb.date}</span>
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-400">
                    {statusLabel(fb.status)}
                  </span>
                </div>
              </div>
              <dl className="mt-3 space-y-2 text-sm text-zinc-400">
                {fb.good && (
                  <div>
                    <dt className="text-xs text-zinc-500">良かった点</dt>
                    <dd>{fb.good}</dd>
                  </div>
                )}
                {fb.concern && (
                  <div>
                    <dt className="text-xs text-zinc-500">気になった点</dt>
                    <dd>{fb.concern}</dd>
                  </div>
                )}
                {fb.bug && (
                  <div>
                    <dt className="text-xs text-zinc-500">バグ報告</dt>
                    <dd>{fb.bug}</dd>
                  </div>
                )}
                {fb.freeform && (
                  <div>
                    <dt className="text-xs text-zinc-500">自由記述</dt>
                    <dd>{fb.freeform}</dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function VoicesAggTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {studioAggregatedSections.map((section) => (
        <article
          key={section.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{section.title}</h3>
            <span className="text-sm text-violet-300">
              {section.count}件 · {section.percent}%
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-400">{section.summary}</p>
          <p className="mt-3 rounded-lg bg-violet-600/10 px-3 py-2 text-sm leading-relaxed text-violet-100/90">
            {section.interpretation}
          </p>
        </article>
      ))}
    </div>
  );
}

function DevlogTab() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
      >
        新規 Devlog 作成
      </button>

      {showForm && (
        <form className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-400">タイトル</span>
            <input className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200" />
          </label>
          <label className="block">
            <span className="text-sm text-zinc-400">本文</span>
            <textarea rows={5} className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-200" />
          </label>
          <button type="button" className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white">
            公開
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {studioDevlogItems.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <span
                className={`rounded-md px-2 py-0.5 text-xs ${
                  item.status === "公開"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{item.date}</p>
            <p className="mt-3 text-sm text-zinc-400">{item.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionsTab() {
  const current = studioVersionItems.find((v) => v.isCurrent);

  return (
    <div className="space-y-8">
      <button
        type="button"
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
      >
        新しい版を登録
      </button>

      {current && (
        <section className="rounded-2xl border border-violet-500/30 bg-violet-600/5 p-5">
          <h3 className="text-sm font-semibold text-violet-200">現在版</h3>
          <p className="mt-2 text-xl font-bold text-white">{current.version}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {current.status} · 公開日 {current.publishedAt}
          </p>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-zinc-300">過去版一覧</h3>
        <ul className="mt-3 space-y-2">
          {studioVersionItems.map((ver) => (
            <li
              key={ver.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm"
            >
              <span className="font-medium text-zinc-200">{ver.version}</span>
              <span className="text-zinc-500">
                {ver.publishedAt} · {ver.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-300">プレイヤーへの質問（最大10問）</h3>
        <ul className="mt-3 space-y-2">
          {studioVersionQuestions.map((q, i) => (
            <li
              key={q}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-300"
            >
              {i + 1}. {q}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReleaseTab() {
  const release = studioReleaseState;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
        <p className="text-sm text-zinc-500">現在状態</p>
        <p className="mt-1 text-2xl font-bold text-white">{release.phase}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          正式版公開
        </button>
        <button
          type="button"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600"
        >
          Reopen
        </button>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-zinc-300">履歴</h3>
        <ul className="mt-3 space-y-2">
          {release.history.map((item) => (
            <li
              key={item.id}
              className="flex justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm"
            >
              <span className="text-zinc-200">{item.label}</span>
              <span className="text-zinc-500">{item.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StudioProjectDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = getStudioProjectDetail(id);
  const activeTab = parseStudioProjectTab(searchParams.get("tab"));

  if (!project) {
    return (
      <StudioShell activeNav="projects">
        <p className="text-zinc-500">プロジェクトが見つかりません</p>
      </StudioShell>
    );
  }

  function setTab(tab: string) {
    router.push(`/studio/projects/${id}?tab=${tab}`, { scroll: false });
  }

  return (
    <StudioShell activeNav="projects">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/studio/projects"
          className="text-sm text-zinc-500 hover:text-violet-400"
        >
          ← プロジェクト一覧
        </Link>

        <header className="mt-4 flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:flex-row sm:items-center">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
            <Image src={project.image} alt="" fill className="object-cover" sizes="96px" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {project.phase} · {project.version}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 text-violet-400" />
                見届け人 {project.witnessCount}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="size-4 text-violet-400" />
                フィードバック {project.voiceCount}
              </span>
            </div>
          </div>
        </header>

        <div className="mt-8">
          <StudioProjectTabs activeTab={activeTab} onTabChange={setTab} />
        </div>

        <div className="mt-6 pb-8">
          {activeTab === "overview" && <OverviewTab project={project} />}
          {activeTab === "voices-raw" && <VoicesRawTab />}
          {activeTab === "voices-agg" && <VoicesAggTab />}
          {activeTab === "devlog" && <DevlogTab />}
          {activeTab === "versions" && <VersionsTab />}
          {activeTab === "release" && <ReleaseTab />}
        </div>
      </div>
    </StudioShell>
  );
}

export function StudioProjectDetailPage({ id }: { id: string }) {
  return (
    <Suspense fallback={<StudioShell activeNav="projects"><p className="text-zinc-500">読み込み中…</p></StudioShell>}>
      <StudioProjectDetailContent id={id} />
    </Suspense>
  );
}
