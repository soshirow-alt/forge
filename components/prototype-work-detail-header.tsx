"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DOMAIN_EXPANSION_PROTO_BANNER,
  PROTOTYPE_DETAIL_COMPARE_LINKS,
  type PrototypeDetailFixture,
} from "@/lib/prototype/domain-expansion";
import { GeneratedThumbnailPoster } from "@/components/generated-thumbnail-poster";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
      {children}
    </span>
  );
}

function MediaPanel({ fixture }: { fixture: PrototypeDetailFixture }) {
  if (fixture.mediaMode === "artwork" && fixture.imageUrl) {
    return (
      <div className="relative aspect-video overflow-hidden bg-zinc-800">
        <Image
          src={fixture.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
        />
      </div>
    );
  }

  if (fixture.mediaMode === "generated") {
    return (
      <div className="relative aspect-video overflow-hidden bg-zinc-800">
        <GeneratedThumbnailPoster
          projectId={`proto-${fixture.slug}`}
          title={fixture.title}
          genre={fixture.mediaKindLabel ?? fixture.categoryLabel}
          phase={fixture.statusLabel}
          compact={false}
        />
        <p className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-zinc-200">
          案A: 生成ポスター（ゲーム流用）
        </p>
      </div>
    );
  }

  return (
    <div className="flex aspect-video flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/40 p-6">
      <div className="flex flex-wrap gap-2">
        <Chip>{fixture.categoryLabel}</Chip>
        {fixture.mediaKindLabel ? <Chip>{fixture.mediaKindLabel}</Chip> : null}
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          案B: タイトル中心（アートワークなし）
        </p>
        <p className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
          {fixture.title}
        </p>
        <p className="mt-2 text-sm text-zinc-400">{fixture.statusLabel}</p>
      </div>
    </div>
  );
}

/**
 * Detail page upper shell only — tabs/body intentionally omitted for comparison.
 * CTAs do not call recordPlay.
 */
export function PrototypeWorkDetailHeader({
  fixture,
}: {
  fixture: PrototypeDetailFixture;
}) {
  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
        {DOMAIN_EXPANSION_PROTO_BANNER}
        <span className="mt-1 block text-zinc-400">
          詳細は上部シェルのみ。タブ構成は未確定のため表示していません。
        </span>
      </p>

      <nav className="flex flex-wrap gap-2 text-xs">
        {PROTOTYPE_DETAIL_COMPARE_LINKS.map((item) => {
          const active = item.href.endsWith(`/${fixture.slug}`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg border px-2.5 py-1.5 transition-colors ${
                active
                  ? "border-violet-500/50 bg-violet-500/15 text-violet-100"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <section className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <MediaPanel fixture={fixture} />

          <div className="flex min-w-0 flex-col justify-center p-6 lg:p-8">
            <div className="flex flex-wrap gap-2">
              <Chip>{fixture.categoryLabel}</Chip>
              <Chip>{fixture.statusLabel}</Chip>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {fixture.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{fixture.lead}</p>

            <Link
              href={fixture.creatorHref}
              className="mt-4 inline-flex text-sm text-zinc-300 transition-colors hover:text-violet-300"
            >
              {fixture.creator}
            </Link>

            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-medium text-zinc-500">誰向けか</dt>
                <dd className="mt-0.5 text-zinc-200">{fixture.audience}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-zinc-500">試し方</dt>
                <dd className="mt-0.5 text-zinc-200">{fixture.tryInfo}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-zinc-500">
                  作者が今確認したいこと
                </dt>
                <dd className="mt-0.5 text-zinc-200">{fixture.authorFocus}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-zinc-500">FBの活用目的</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {fixture.fbPurposes.map((purpose) => (
                    <Chip key={purpose}>{purpose}</Chip>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
                onClick={() => {
                  // Prototype only — never recordPlay for non-game / mock CTAs.
                }}
              >
                {fixture.primaryCta}
              </button>
              <span className="text-xs text-zinc-500">{fixture.secondaryCtaHint}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300"
              >
                保存
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300"
              >
                更新を追う
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300"
              >
                制作者をフォロー
              </button>
              <span className="rounded-lg border border-dashed border-zinc-700 px-3 py-1.5 text-xs text-zinc-500">
                Studio管理（本人時）
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
        下部タブ（概要 / 更新 / FB / Special Thanks 等）は今回の比較対象外です
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/home" className="text-violet-300 hover:underline">
          ← Exploreホーム
        </Link>
        <Link href="/prototype" className="text-zinc-400 hover:underline">
          比較一覧
        </Link>
      </div>
    </div>
  );
}
