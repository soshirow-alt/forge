import Link from "next/link";
import { ArrowLeft, Heart, MessageSquare, Users } from "lucide-react";
import {
  ExplorePrototypeDetailPrimaryCta,
  ExplorePrototypeFeedbackProtoButton,
} from "@/components/explore-prototype/explore-prototype-detail-cta";
import { ExplorePrototypeNav } from "@/components/explore-prototype/explore-prototype-nav";
import { ExplorePrototypeRelatedCard } from "@/components/explore-prototype/explore-prototype-related-card";
import type { ExplorePrototypeWork } from "@/lib/prototype/explore-prototype";
import {
  getExplorePrototypeCategory,
  getExplorePrototypeRelatedWorks,
  resolveExplorePrototypeThumbnail,
} from "@/lib/prototype/explore-prototype";

function MetaChip({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-full truncate rounded-md border border-zinc-700/90 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
      {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 border-b border-zinc-800/70 py-2 text-sm last:border-b-0 sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-zinc-200">{value}</dd>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm leading-relaxed text-zinc-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-violet-400" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CategoryInfoRows({ work }: { work: ExplorePrototypeWork }) {
  if (work.category === "game") {
    return (
      <dl>
        <InfoRow label="フェーズ" value={work.phase} />
        <InfoRow label="ジャンル" value={work.genre} />
        <InfoRow label="タグ" value={work.tags.join(" / ")} />
        {work.estimatedPlayTime ? (
          <InfoRow label="想定プレイ時間" value={work.estimatedPlayTime} />
        ) : null}
        <InfoRow label="対応端末" value={work.platforms.join(" / ")} />
        {work.controlsOrConditions ? (
          <InfoRow label="操作・条件" value={work.controlsOrConditions} />
        ) : null}
      </dl>
    );
  }

  if (work.category === "audio") {
    return (
      <dl>
        <InfoRow label="フェーズ" value={work.phase} />
        <InfoRow label="種類" value={work.kind} />
        {work.genre ? <InfoRow label="ジャンル" value={work.genre} /> : null}
        <InfoRow label="タグ" value={work.tags.join(" / ")} />
        <InfoRow label="再生時間" value={work.durationLabel} />
        {work.listeningContext ? (
          <InfoRow label="推奨環境・用途" value={work.listeningContext} />
        ) : null}
      </dl>
    );
  }

  if (work.category === "dev-tool") {
    return (
      <dl>
        <InfoRow label="フェーズ" value={work.phase} />
        <InfoRow label="ツール種類" value={work.kind} />
        <InfoRow label="タグ" value={work.tags.join(" / ")} />
        <InfoRow label="対応環境" value={work.environments.join(" / ")} />
        <InfoRow label="利用方法" value={work.usageMethod} />
        {work.targetUsers ? (
          <InfoRow label="対象ユーザー" value={work.targetUsers} />
        ) : null}
        {work.prerequisites ? (
          <InfoRow label="導入前提" value={work.prerequisites} />
        ) : null}
      </dl>
    );
  }

  return (
    <dl>
      <InfoRow label="フェーズ" value={work.phase} />
      <InfoRow label="サービス種類" value={work.kind} />
      <InfoRow label="タグ" value={work.tags.join(" / ")} />
      <InfoRow label="対応環境" value={work.environments.join(" / ")} />
      {work.intendedUsers ? (
        <InfoRow label="想定利用者" value={work.intendedUsers} />
      ) : null}
      {work.problemSolved ? (
        <InfoRow label="解決する課題" value={work.problemSolved} />
      ) : null}
      {work.usageScenes && work.usageScenes.length > 0 ? (
        <InfoRow label="主な利用シーン" value={work.usageScenes.join(" / ")} />
      ) : null}
    </dl>
  );
}

function tagChips(work: ExplorePrototypeWork): string[] {
  if (work.category === "game") return [work.genre, ...work.tags];
  if (work.category === "audio") {
    return [work.kind, ...(work.genre ? [work.genre] : []), ...work.tags];
  }
  return [work.kind, ...work.tags];
}

export function ExplorePrototypeDetailPage({
  work,
}: {
  work: ExplorePrototypeWork;
}) {
  const meta = getExplorePrototypeCategory(work.category);
  const thumb = resolveExplorePrototypeThumbnail(work);
  const related = getExplorePrototypeRelatedWorks(work, 3);
  const backHref = meta?.href ?? "/explore/prototype/game";
  const backLabel = meta ? `${meta.label}を探す` : "作品を探す";
  // Shorten back label for long category names on mobile — use "探す" prefix styles
  const backShort =
    work.category === "game"
      ? "ゲームを探す"
      : work.category === "audio"
        ? "音楽・音声を探す"
        : work.category === "dev-tool"
          ? "開発ツールを探す"
          : "Webサービス・アプリを探す";

  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-violet-300 transition-colors hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          <span>{backShort}</span>
        </Link>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
            Explore
          </p>
          <h1 className="sr-only">{work.title}</h1>
        </div>

        <ExplorePrototypeNav active={work.category} />

        <p className="text-sm font-medium text-zinc-400">{meta?.label}</p>
      </header>

      {/* Hero: image + action column */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)] lg:items-start">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950 shadow-lg shadow-black/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb.src}
            alt={work.thumbnailAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-800/90 bg-zinc-900/40 p-4 sm:p-5">
          <div className="space-y-2">
            <h2 className="text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl">
              {work.title}
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              {work.shortDescription}
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-xs font-semibold text-violet-100 ring-1 ring-violet-500/40"
              aria-hidden="true"
            >
              {work.creatorInitials.slice(0, 2)}
            </span>
            <span className="truncate text-sm text-zinc-300">
              {work.creatorName}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <MetaChip label={work.phase} />
            {tagChips(work).map((label) => (
              <MetaChip key={label} label={label} />
            ))}
          </div>

          <ExplorePrototypeDetailPrimaryCta
            category={work.category}
            title={work.title}
          />

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
              フィードバック {work.feedbackCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 text-violet-400" aria-hidden="true" />
              フォロー {work.followCount}
            </span>
            <span>最終更新 {work.updatedLabel}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-3xl gap-8 lg:max-w-none lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)]">
        <div className="space-y-8">
          <section className="space-y-3" aria-labelledby="about-heading">
            <h3 id="about-heading" className="text-lg font-semibold text-white">
              この作品について
            </h3>
            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
              {work.description}
            </p>
          </section>

          <section className="space-y-3" aria-labelledby="highlights-heading">
            <h3 id="highlights-heading" className="text-lg font-semibold text-white">
              主な特徴
            </h3>
            <BulletList items={work.highlights} />
          </section>

          <section className="space-y-3" aria-labelledby="try-heading">
            <h3 id="try-heading" className="text-lg font-semibold text-white">
              今回試してほしいこと
            </h3>
            <BulletList items={work.tryFocus} />
          </section>

          <section
            className="space-y-3 rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-4 sm:p-5"
            aria-labelledby="update-heading"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="update-heading" className="text-lg font-semibold text-white">
                最新の更新
              </h3>
              <MetaChip label={work.latestUpdate.versionLabel} />
              <span className="text-xs text-zinc-500">
                {work.latestUpdate.dateLabel}
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-200">
              {work.latestUpdate.title}
            </p>
            <BulletList items={work.latestUpdate.changes} />
          </section>

          <section className="space-y-3" aria-labelledby="feedback-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="feedback-heading" className="text-lg font-semibold text-white">
                フィードバック
              </h3>
              <ExplorePrototypeFeedbackProtoButton />
            </div>

            {work.feedbackSamples.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700/80 bg-zinc-950/40 px-4 py-6 text-center">
                <p className="text-sm font-medium text-zinc-300">
                  まだフィードバックはありません
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  最初に試して、感じたことを届けてみませんか？
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {work.feedbackSamples.map((sample) => (
                  <li
                    key={`${sample.displayName}-${sample.relativeDate}-${sample.comment.slice(0, 12)}`}
                    className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-100">
                        {sample.displayName}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {sample.relativeDate}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                      {sample.comment}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-500">
                      <Heart className="size-3 text-violet-400" aria-hidden="true" />
                      共感 {sample.empathyCount}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <h3 className="text-lg font-semibold text-white">作品情報</h3>
          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 px-4 py-2">
            <CategoryInfoRows work={work} />
          </div>
          <p className="text-[11px] text-zinc-600" aria-hidden="true">
            {backLabel}
          </p>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="space-y-4" aria-labelledby="related-heading">
          <h3 id="related-heading" className="text-lg font-semibold text-white">
            同じカテゴリの作品
          </h3>
          <ul className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
            {related.map((item) => (
              <li
                key={item.id}
                className="w-[min(78vw,16rem)] shrink-0 sm:w-auto sm:min-w-0"
              >
                <ExplorePrototypeRelatedCard work={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
