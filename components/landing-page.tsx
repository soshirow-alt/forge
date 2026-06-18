import Image from "next/image";
import Link from "next/link";
import {
  LP_CONTENT_WIDTH,
  LP_CTA_GAP,
  LP_CTA_HEIGHT,
  LP_CTA_ICON,
  LP_FEATURED_GAP,
  LP_FEATURED_SECTION_Y,
  LP_FOOTER_Y,
  LP_HEADER_HEIGHT,
  LP_H1_SIZE,
  LP_HERO_BOTTOM,
  LP_HERO_COL_LEFT,
  LP_HERO_COL_RIGHT,
  LP_HERO_GRID_GAP,
  LP_HERO_GRID_TOP,
  LP_HERO_TOP,
  LP_LEAD_SIZE,
  LP_NEWS_SECTION_Y,
  LP_REF_WIDTH,
  LP_THUMB_ASPECT,
  LP_VALUE_BODY,
  LP_VALUE_GAP,
  LP_VALUE_ICON,
  LP_VALUE_TITLE,
} from "@/components/landing-design";
import { LandingPageScaler } from "@/components/landing-page-scaler";

const valueProps = [
  {
    iconClass: "bg-violet-500/25 text-violet-200 ring-violet-400/40",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4-.8L3 20l1.2-3.6A7.8 7.8 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
      </svg>
    ),
    title: "プレイして、声を届ける",
    body: "あなたのフィードバックがゲームを進化させます。",
  },
  {
    iconClass: "bg-emerald-500/25 text-emerald-200 ring-emerald-400/40",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m5 15 4-4 3 3 6-7 4 4" />
        <path d="M19 5v4h-4" />
      </svg>
    ),
    title: "開発の過程から、見届ける",
    body: "開発のストーリーを追いかけ、成長を見守れます。",
  },
  {
    iconClass: "bg-orange-500/25 text-orange-200 ring-orange-400/40",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    title: "一緒に、最高の体験をつくる",
    body: "開発者とプレイヤーがつながり、まだ見ぬ名作が生まれていきます。",
  },
] as const;

const featuredGames = [
  {
    title: "星灯の旅路",
    description: "ランタンを頼りに、忘れられた大陸を横断する探索アドベンチャー。",
    feedback: 24,
    updated: "3日前",
    hue: "from-violet-900 via-purple-800 to-indigo-950",
  },
  {
    title: "炉心の残光",
    description: "滅びゆく炉心都市で、最後の鍛冶師となって装備を試すアクション。",
    feedback: 18,
    updated: "5日前",
    hue: "from-orange-900 via-amber-700 to-orange-950",
  },
  {
    title: "浮遊ノート",
    description: "空島を跳び移りながら、失われた旋律を集めるパズル探索。",
    feedback: 11,
    updated: "1日前",
    hue: "from-teal-900 via-cyan-800 to-slate-900",
  },
  {
    title: "夏の向こう側",
    description: "終わらない夏の町で、選択だけが世界の季節を変えていく。",
    feedback: 31,
    updated: "2日前",
    hue: "from-rose-900 via-pink-800 to-fuchsia-950",
  },
  {
    title: "深淵ノート",
    description: "深海調査船のログを辿り、未知の生態系に触れるサバイバル。",
    feedback: 9,
    updated: "4日前",
    hue: "from-blue-950 via-indigo-900 to-slate-950",
  },
] as const;

function ForgeLogo() {
  return (
    <Link href="/landing" className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-6 w-6 shrink-0">
        <defs>
          <linearGradient id="forge-flame" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e879f9" />
            <stop offset="1" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <path
          fill="url(#forge-flame)"
          d="M16 4c-1.5 4-4 6.5-4 10.5 0 2.8 1.8 5 4 5s4-2.2 4-5C20 10.5 17.5 8 16 4Zm0 22c-4.5 0-8-3.2-8-7.5 0-2.2.8-4.2 2.2-5.8.6 3.2 2.6 5.3 5.8 5.3 3.2 0 5.2-2.1 5.8-5.3 1.4 1.6 2.2 3.6 2.2 5.8C24 22.8 20.5 26 16 26Z"
        />
      </svg>
      <span className="text-base font-semibold tracking-tight text-white">Forge</span>
    </Link>
  );
}

function FeaturedGameCard({ game }: { game: (typeof featuredGames)[number] }) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-800/60 bg-[#111118]/80">
      <div className={`bg-gradient-to-br ${game.hue}`} style={{ aspectRatio: LP_THUMB_ASPECT }} />
      <div className="space-y-1 p-2.5">
        <h3 className="truncate text-xs font-semibold text-white">{game.title}</h3>
        <p className="line-clamp-1 text-[11px] leading-snug text-zinc-500">{game.description}</p>
        <div className="flex items-center gap-2 text-[10px] text-violet-400/90">
          <span>💬 {game.feedback}</span>
          <span className="text-zinc-500">🕒 {game.updated}</span>
        </div>
      </div>
    </article>
  );
}

function PlayerCtaCard() {
  return (
    <div
      className="flex shrink-0 flex-col rounded-lg border border-violet-500/30 bg-[#14141c]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
      style={{ height: LP_CTA_HEIGHT }}
    >
      <p className="text-[10px] font-medium text-violet-300/90">プレイヤーのあなたへ</p>
      <div className="flex flex-col items-center py-2">
        <span
          className="flex items-center justify-center rounded-full bg-violet-500/25 text-xl ring-1 ring-violet-400/35"
          style={{ width: LP_CTA_ICON, height: LP_CTA_ICON }}
        >
          🎮
        </span>
        <h3 className="mt-2.5 text-center text-[15px] font-bold leading-snug text-white">プレイヤーとして参加</h3>
        <p className="mt-1.5 max-w-[11rem] text-center text-[11px] leading-snug text-zinc-400">
          ゲームを探してプレイし、開発者にフィードバックを届けましょう。
        </p>
      </div>
      <div className="mt-auto space-y-1.5">
        <Link
          href="/"
          className="block rounded-md bg-[#3b82f6] py-2 text-center text-xs font-semibold text-white transition hover:bg-[#2563eb]"
        >
          ゲームを探す
        </Link>
        <Link
          href="/login?mode=signup"
          className="block text-center text-[11px] text-zinc-500 transition hover:text-zinc-300"
        >
          アカウントを作成する
        </Link>
      </div>
    </div>
  );
}

function DeveloperCtaCard() {
  return (
    <div
      className="flex shrink-0 flex-col rounded-lg border border-emerald-500/30 bg-[#14141c]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
      style={{ height: LP_CTA_HEIGHT }}
    >
      <p className="text-[10px] font-medium text-emerald-300/90">開発者のあなたへ</p>
      <div className="flex flex-col items-center py-2">
        <span
          className="flex items-center justify-center rounded-full bg-emerald-500/25 text-xl ring-1 ring-emerald-400/35"
          style={{ width: LP_CTA_ICON, height: LP_CTA_ICON }}
        >
          🔧
        </span>
        <h3 className="mt-2.5 text-center text-[15px] font-bold leading-snug text-white">開発者としてはじめる</h3>
        <p className="mt-1.5 max-w-[11rem] text-center text-[11px] leading-snug text-zinc-400">
          あなたのゲームを公開し、プレイヤーと一緒に育てていきましょう。
        </p>
      </div>
      <div className="mt-auto space-y-1.5">
        <span
          title="Studio 画面は未実装"
          className="block cursor-not-allowed rounded-md bg-[#10b981] py-2 text-center text-xs font-semibold text-white/95"
        >
          Studioに入る
        </span>
        <Link
          href="/login?mode=signup"
          className="block text-center text-[11px] text-zinc-500 transition hover:text-zinc-300"
        >
          アカウントを作成する
        </Link>
      </div>
    </div>
  );
}

/**
 * モック基準アートボード（参照幅 LP_REF_WIDTH）。
 * 個別 responsive 伸縮なし — LandingPageScaler が全体を均一 scale。
 */
function LandingPageCanvas({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative bg-[#0a0a0f] text-zinc-100 ${className}`}
      style={{ width: LP_REF_WIDTH }}
    >
      <section className="relative">
        <Image
          src="/images/landing-hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-[center_22%] opacity-90"
          sizes={`${LP_REF_WIDTH}px`}
        />
        <div className="absolute inset-0 bg-[#0a0a0f]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/95 via-[#0a0a0f]/72 to-[#0a0a0f]/38" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/35 via-transparent to-[#0a0a0f]" />

        <header className="relative z-10 border-b border-white/[0.06]">
          <div
            className="mx-auto flex items-center justify-between"
            style={{ width: LP_CONTENT_WIDTH, height: LP_HEADER_HEIGHT }}
          >
            <ForgeLogo />
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border border-zinc-600/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.04]"
              >
                ログイン
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2563eb]"
              >
                新規登録
              </Link>
            </div>
          </div>
        </header>

        <div
          className="relative z-10 mx-auto"
          style={{
            width: LP_CONTENT_WIDTH,
            paddingTop: LP_HERO_TOP,
            paddingBottom: LP_HERO_BOTTOM,
          }}
        >
          <h1
            className="font-bold leading-[1.12] tracking-tight"
            style={{ fontSize: LP_H1_SIZE }}
          >
            ゲームを、
            <span className="bg-gradient-to-r from-[#c084fc] via-[#e879f9] to-[#f472b6] bg-clip-text text-transparent">
              育てる
            </span>
            場所。
          </h1>

          <div
            className="grid items-start"
            style={{
              marginTop: LP_HERO_GRID_TOP,
              gap: LP_HERO_GRID_GAP,
              gridTemplateColumns: `${LP_HERO_COL_LEFT} ${LP_HERO_COL_RIGHT}`,
            }}
          >
            <div>
              <p
                className="max-w-[520px] leading-[1.65] text-zinc-300"
                style={{ fontSize: LP_LEAD_SIZE }}
              >
                プレイヤーの声が、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。
              </p>

              <ul style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: LP_VALUE_GAP }}>
                {valueProps.map((item) => (
                  <li key={item.title} className="flex gap-2.5">
                    <span
                      className={`flex shrink-0 items-center justify-center rounded-full ring-1 ${item.iconClass}`}
                      style={{ width: LP_VALUE_ICON, height: LP_VALUE_ICON }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-semibold leading-snug text-white" style={{ fontSize: LP_VALUE_TITLE }}>
                        {item.title}
                      </p>
                      <p className="mt-0.5 leading-relaxed text-zinc-500" style={{ fontSize: LP_VALUE_BODY }}>
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2" style={{ gap: LP_CTA_GAP }}>
              <PlayerCtaCard />
              <DeveloperCtaCard />
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-zinc-800/50 bg-[#0a0a0f]"
        style={{ paddingTop: LP_FEATURED_SECTION_Y, paddingBottom: LP_FEATURED_SECTION_Y }}
      >
        <div className="mx-auto" style={{ width: LP_CONTENT_WIDTH }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-bold text-white">注目の開発中ゲーム</h2>
            <Link href="/" className="text-[11px] text-zinc-500 transition hover:text-zinc-300">
              すべて見る →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-5" style={{ gap: LP_FEATURED_GAP }}>
            {featuredGames.map((game) => (
              <FeaturedGameCard key={game.title} game={game} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y border-zinc-800/60 bg-[#0d0d12]"
        style={{ paddingTop: LP_NEWS_SECTION_Y, paddingBottom: LP_NEWS_SECTION_Y }}
      >
        <div className="mx-auto flex items-center justify-between gap-4" style={{ width: LP_CONTENT_WIDTH }}>
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold text-white">Forge からのお知らせ</h2>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
              2025/05/20 Forge v0.4.0 アップデート… 改善ループの可視化、通知のカスタマイズ など
            </p>
          </div>
          <span className="shrink-0 text-[11px] text-zinc-600">お知らせ一覧 →</span>
        </div>
      </section>

      <footer className="bg-[#0a0a0f]" style={{ paddingTop: LP_FOOTER_Y, paddingBottom: LP_FOOTER_Y }}>
        <div className="mx-auto flex items-center justify-end gap-5" style={{ width: LP_CONTENT_WIDTH }}>
          <nav className="flex flex-wrap gap-x-3.5 gap-y-1 text-[10px] text-zinc-600">
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
            <span>ヘルプ</span>
            <span>お問い合わせ</span>
          </nav>
          <p className="text-[10px] text-zinc-700">© 2025 Forge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/** lg 未満 — モック比率は維持しつつ viewport 幅に折り返し */
function LandingPageMobile() {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-zinc-100 lg:hidden">
      <section className="relative">
        <Image
          src="/images/landing-hero-bg.png"
          alt=""
          width={LP_REF_WIDTH}
          height={1080}
          priority
          className="h-56 w-full object-cover object-[center_22%] opacity-90"
        />
        <div className="absolute inset-0 bg-[#0a0a0f]/55" />
        <header className="relative border-b border-white/[0.06] px-5">
          <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between">
            <ForgeLogo />
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border border-zinc-600/80 px-3 py-1.5 text-xs font-medium text-zinc-200"
              >
                ログイン
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-md bg-[#3b82f6] px-3 py-1.5 text-xs font-semibold text-white"
              >
                新規登録
              </Link>
            </div>
          </div>
        </header>
        <div className="relative px-5 pb-8 pt-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            ゲームを、
            <span className="bg-gradient-to-r from-[#c084fc] via-[#e879f9] to-[#f472b6] bg-clip-text text-transparent">
              育てる
            </span>
            場所。
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            プレイヤーの声が、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。
          </p>
          <ul className="mt-5 space-y-4">
            {valueProps.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${item.iconClass}`}
                >
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PlayerCtaCard />
            <DeveloperCtaCard />
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800/50 px-5 py-6">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">注目の開発中ゲーム</h2>
            <Link href="/" className="text-xs text-zinc-500">
              すべて見る →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {featuredGames.map((game) => (
              <FeaturedGameCard key={game.title} game={game} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-800/60 bg-[#0d0d12] px-5 py-4">
        <div className="mx-auto max-w-[1120px]">
          <h2 className="text-xs font-semibold text-white">Forge からのお知らせ</h2>
          <p className="mt-1 text-xs text-zinc-500">
            2025/05/20 Forge v0.4.0 アップデート… 改善ループの可視化、通知のカスタマイズ など
          </p>
        </div>
      </section>

      <footer className="px-5 py-4">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 text-[10px] text-zinc-600 sm:items-end">
          <nav className="flex flex-wrap gap-x-3 gap-y-1">
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
            <span>ヘルプ</span>
            <span>お問い合わせ</span>
          </nav>
          <p className="text-zinc-700">© 2025 Forge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export function LandingPage() {
  return (
    <>
      <LandingPageScaler>
        <LandingPageCanvas />
      </LandingPageScaler>
      <LandingPageMobile />
    </>
  );
}
