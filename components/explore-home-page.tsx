"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CATEGORY_SHELF_WORKS,
  DOMAIN_EXPANSION_PROTO_BANNER,
  FEATURED_PROTOTYPE_WORKS,
  WORK_CATEGORY_NAV,
  type PrototypeWorkCard,
  type WorkCategoryId,
} from "@/lib/prototype/domain-expansion";

function ProtoBanner() {
  return (
    <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
      {DOMAIN_EXPANSION_PROTO_BANNER}
      <span className="mt-1 block text-zinc-400">
        上部の Explore ナビでカテゴリ面へ移動できます。詳細比較は{" "}
        <Link href="/prototype" className="text-violet-300 underline-offset-2 hover:underline">
          /prototype
        </Link>
        。
      </span>
    </p>
  );
}

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-md border border-zinc-700 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
      {label}
    </span>
  );
}

function FeaturedMedia({ work }: { work: PrototypeWorkCard }) {
  if (work.imageUrl) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-800">
        <Image
          src={work.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 360px"
        />
      </div>
    );
  }

  if (work.category === "music") {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-800 px-3 text-center">
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Audio
        </span>
        <span className="line-clamp-2 text-sm font-semibold text-white">{work.title}</span>
      </div>
    );
  }

  return (
    <div className="flex aspect-video flex-col justify-end rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
      <CategoryBadge label={work.categoryLabel} />
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">{work.title}</p>
    </div>
  );
}

function WorkCard({ work }: { work: PrototypeWorkCard }) {
  return (
    <Link href={`/prototype/works/${work.slug}`} className="block min-w-0">
      <article>
        <FeaturedMedia work={work} />
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <CategoryBadge label={work.categoryLabel} />
          <span className="text-[11px] text-zinc-500">{work.statusLabel}</span>
        </div>
        <h3 className="mt-1 truncate text-sm font-semibold text-white">{work.title}</h3>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{work.creator}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">{work.lead}</p>
      </article>
    </Link>
  );
}

function CategoryEntryCard({
  label,
  shortAction,
  href,
}: {
  label: string;
  shortAction: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-violet-500/40 hover:bg-zinc-900/70"
    >
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-zinc-400">{shortAction}</p>
    </Link>
  );
}

function ShelfSection({
  categoryId,
  title,
}: {
  categoryId: WorkCategoryId;
  title: string;
}) {
  const works = CATEGORY_SHELF_WORKS[categoryId];
  const nav = WORK_CATEGORY_NAV.find((item) => item.id === categoryId);
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        {nav ? (
          <Link
            href={nav.href}
            className="shrink-0 text-sm text-violet-400 transition-colors hover:text-violet-300"
          >
            入口へ →
          </Link>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </section>
  );
}

/**
 * Explore home prototype — Forge-wide discovery surface (not game-only).
 * Live game shelves remain at `/home?category=game`.
 */
export function ExploreHomePage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-300">
              Explore
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              作品を見つける
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              ゲーム・音楽・ツール・サービスを、試してフィードバックする場所
            </p>
          </div>
          <Link
            href="/studio"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Studioへ
          </Link>
        </div>
        <ProtoBanner />
      </header>

      <section>
        <h2 className="text-lg font-semibold text-white sm:text-xl">注目の作品</h2>
        <p className="mt-1 text-xs text-zinc-500">
          カテゴリ横断の確認用抜粋（既存のプレイ指標ランキングではありません）
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {FEATURED_PROTOTYPE_WORKS.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white sm:text-xl">カテゴリから探す</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {WORK_CATEGORY_NAV.map((item) => (
            <CategoryEntryCard
              key={item.id}
              label={item.label}
              shortAction={item.shortAction}
              href={item.href}
            />
          ))}
        </div>
      </section>

      <ShelfSection categoryId="game" title="ゲーム" />
      <ShelfSection categoryId="music" title="音楽・音声" />
      <ShelfSection categoryId="dev_tool" title="開発ツール" />
      <ShelfSection categoryId="web_service" title="サービス・アプリ" />

      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
        <p className="text-sm font-medium text-zinc-200">比較用リンク</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Link href="/home?category=game" className="text-violet-300 hover:underline">
            ゲーム面
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/home?category=audio" className="text-violet-300 hover:underline">
            音楽・音声面
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/home?category=dev-tool" className="text-violet-300 hover:underline">
            開発ツール面
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/home?category=service-app" className="text-violet-300 hover:underline">
            サービス・アプリ面
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/studio/submit?view=category-proto" className="text-violet-300 hover:underline">
            投稿分岐
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/prototype" className="text-violet-300 hover:underline">
            詳細上部
          </Link>
        </div>
      </section>
    </div>
  );
}
