import Image from "next/image";
import Link from "next/link";

const valueProps = [
  {
    iconClass: "bg-violet-500/20 text-violet-300 ring-violet-400/30",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4-.8L3 20l1.2-3.6A7.8 7.8 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
      </svg>
    ),
    title: "プレイして、声を届ける",
    body: "あなたのフィードバックがゲームを進化させます。",
  },
  {
    iconClass: "bg-emerald-500/20 text-emerald-300 ring-emerald-400/30",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m5 15 4-4 3 3 6-7 4 4" />
        <path d="M19 5v4h-4" />
      </svg>
    ),
    title: "開発の過程から、見届ける",
    body: "開発のストーリーを追いかけ、成長を見守れます。",
  },
  {
    iconClass: "bg-orange-500/20 text-orange-300 ring-orange-400/30",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
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
    hue: "from-indigo-900 via-violet-800 to-slate-900",
  },
  {
    title: "炉心の残光",
    description: "滅びゆく炉心都市で、最後の鍛冶師となって装備を試すアクション。",
    feedback: 18,
    updated: "5日前",
    hue: "from-orange-900 via-amber-800 to-zinc-900",
  },
  {
    title: "浮遊ノート",
    description: "空島を跳び移りながら、失われた旋律を集めるパズル探索。",
    feedback: 11,
    updated: "1日前",
    hue: "from-cyan-900 via-teal-800 to-slate-900",
  },
  {
    title: "夏の向こう側",
    description: "終わらない夏の町で、選択だけが世界の季節を変えていく。",
    feedback: 31,
    updated: "2日前",
    hue: "from-rose-900 via-pink-800 to-zinc-900",
  },
  {
    title: "深淵ノート",
    description: "深海調査船のログを辿り、未知の生態系に触れるサバイバル。",
    feedback: 9,
    updated: "4日前",
    hue: "from-blue-950 via-indigo-900 to-black",
  },
] as const;

function ForgeLogo() {
  return (
    <Link href="/landing" className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 shrink-0">
        <defs>
          <linearGradient id="forge-flame" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f472b6" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          fill="url(#forge-flame)"
          d="M16 4c-1.5 4-4 6.5-4 10.5 0 2.8 1.8 5 4 5s4-2.2 4-5C20 10.5 17.5 8 16 4Zm0 22c-4.5 0-8-3.2-8-7.5 0-2.2.8-4.2 2.2-5.8.6 3.2 2.6 5.3 5.8 5.3 3.2 0 5.2-2.1 5.8-5.3 1.4 1.6 2.2 3.6 2.2 5.8C24 22.8 20.5 26 16 26Z"
        />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-tight text-white">Forge</span>
    </Link>
  );
}

function FeaturedGameCard({ game }: { game: (typeof featuredGames)[number] }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-zinc-800/70 bg-zinc-900/50">
      <div className={`aspect-[16/10] bg-gradient-to-br ${game.hue}`} />
      <div className="space-y-1.5 p-2.5">
        <h3 className="truncate text-[13px] font-semibold text-white">{game.title}</h3>
        <p className="line-clamp-1 text-[11px] leading-snug text-zinc-400">{game.description}</p>
        <div className="flex items-center gap-2.5 text-[10px] text-violet-300/80">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">💬</span>
            {game.feedback}
          </span>
          <span className="inline-flex items-center gap-1 text-zinc-500">
            <span aria-hidden="true">🕒</span>
            {game.updated}
          </span>
        </div>
      </div>
    </article>
  );
}

function PlayerCtaCard() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-violet-500/25 bg-zinc-950/55 p-4 backdrop-blur-md">
      <p className="text-[10px] font-medium tracking-wide text-violet-300">プレイヤーのあなたへ</p>
      <div className="mt-3 flex justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/20 text-lg ring-1 ring-violet-400/30">
          🎮
        </span>
      </div>
      <h3 className="mt-3 text-center text-[15px] font-bold text-white">プレイヤーとして参加</h3>
      <p className="mt-2 flex-1 text-center text-[11px] leading-relaxed text-zinc-400">
        ゲームを探してプレイし、開発者にフィードバックを届けましょう。
      </p>
      <div className="mt-4 space-y-2">
        <Link
          href="/"
          className="block rounded-md bg-blue-600 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-500"
        >
          ゲームを探す
        </Link>
        <Link
          href="/login?mode=signup"
          className="block text-center text-[11px] text-zinc-400 transition hover:text-white"
        >
          アカウントを作成する
        </Link>
      </div>
    </div>
  );
}

function DeveloperCtaCard() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-emerald-500/25 bg-zinc-950/55 p-4 backdrop-blur-md">
      <p className="text-[10px] font-medium tracking-wide text-emerald-300">開発者のあなたへ</p>
      <div className="mt-3 flex justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/20 text-lg ring-1 ring-emerald-400/30">
          🔧
        </span>
      </div>
      <h3 className="mt-3 text-center text-[15px] font-bold text-white">開発者としてはじめる</h3>
      <p className="mt-2 flex-1 text-center text-[11px] leading-relaxed text-zinc-400">
        あなたのゲームを公開し、プレイヤーと一緒に育てていきましょう。
      </p>
      <div className="mt-4 space-y-2">
        <span
          title="Studio 画面は未実装"
          className="block cursor-not-allowed rounded-md bg-emerald-600 py-2 text-center text-xs font-semibold text-white/90"
        >
          Studioに入る
        </span>
        <Link
          href="/login?mode=signup"
          className="block text-center text-[11px] text-zinc-400 transition hover:text-white"
        >
          アカウントを作成する
        </Link>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      {/* Hero — モック: 背景 + 左(コピー+3価値) + 右(2 CTA) を同一ブロック */}
      <section className="relative overflow-hidden">
        <Image
          src="/images/landing-hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-[center_20%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/70 to-zinc-950/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-transparent to-zinc-950" />

        <header className="relative z-10 border-b border-white/5">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
            <ForgeLogo />
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-md border border-zinc-500/70 px-3.5 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-white/5"
              >
                ログイン
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
              >
                新規登録
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-8">
            <div className="min-w-0">
              <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight sm:text-[2.35rem]">
                ゲームを、
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                  育てる
                </span>
                場所。
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                プレイヤーの声が、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。
              </p>

              <ul className="mt-6 space-y-4 sm:mt-7">
                {valueProps.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${item.iconClass}`}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3">
              <PlayerCtaCard />
              <DeveloperCtaCard />
            </div>
          </div>
        </div>
      </section>

      {/* 注目作品 — モック: 5 列 1 行・コンパクト */}
      <section className="border-t border-zinc-800/80 bg-zinc-950 py-6 sm:py-7">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white sm:text-[15px]">注目の開発中ゲーム</h2>
            <Link href="/" className="text-xs text-zinc-400 transition hover:text-white">
              すべて見る →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
            {featuredGames.map((game) => (
              <FeaturedGameCard key={game.title} game={game} />
            ))}
          </div>
        </div>
      </section>

      {/* お知らせ — スリム帯 */}
      <section className="border-y border-zinc-800 bg-zinc-900/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-white">Forge からのお知らせ</h2>
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              2025/05/20 Forge v0.4.0 アップデート… 改善ループの可視化、通知のカスタマイズ など
            </p>
          </div>
          <span className="shrink-0 text-xs text-zinc-500">お知らせ一覧 →</span>
        </div>
      </section>

      {/* フッター — モック: リンク右寄せ */}
      <footer className="bg-zinc-950 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-end sm:gap-6 sm:px-8">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
            <span>ヘルプ</span>
            <span>お問い合わせ</span>
          </nav>
          <p className="text-[11px] text-zinc-600">© 2025 Forge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
