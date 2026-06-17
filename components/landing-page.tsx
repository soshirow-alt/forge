import Image from "next/image";
import Link from "next/link";

const valueProps = [
  {
    iconClass: "bg-violet-500/25 text-violet-200 ring-violet-400/40",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[1.05em] w-[1.05em]" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4-.8L3 20l1.2-3.6A7.8 7.8 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
      </svg>
    ),
    title: "プレイして、声を届ける",
    body: "あなたのフィードバックがゲームを進化させます。",
  },
  {
    iconClass: "bg-emerald-500/25 text-emerald-200 ring-emerald-400/40",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[1.05em] w-[1.05em]" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      <svg viewBox="0 0 24 24" className="h-[1.05em] w-[1.05em]" fill="none" stroke="currentColor" strokeWidth="1.8">
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
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-[clamp(1.25rem,2.2vh,1.5rem)] w-[clamp(1.25rem,2.2vh,1.5rem)] shrink-0">
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
      <span className="text-[clamp(0.9rem,1.6vh,1rem)] font-semibold tracking-tight text-white">Forge</span>
    </Link>
  );
}

function FeaturedGameCard({ game }: { game: (typeof featuredGames)[number] }) {
  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-zinc-800/60 bg-[#111118]/80">
      <div className={`min-h-0 flex-1 bg-gradient-to-br ${game.hue}`} />
      <div className="shrink-0 space-y-0.5 p-[0.55rem]">
        <h3 className="truncate text-[clamp(0.65rem,1.15vh,0.75rem)] font-semibold text-white">{game.title}</h3>
        <p className="line-clamp-1 text-[clamp(0.58rem,1vh,0.65rem)] leading-snug text-zinc-500">
          {game.description}
        </p>
        <div className="flex items-center gap-2 text-[clamp(0.55rem,0.95vh,0.625rem)] text-violet-400/90">
          <span>💬 {game.feedback}</span>
          <span className="text-zinc-500">🕒 {game.updated}</span>
        </div>
      </div>
    </article>
  );
}

function PlayerCtaCard() {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-violet-500/30 bg-[#14141c]/85 p-[clamp(0.75rem,1.6vh,1.1rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
      <p className="text-[clamp(0.58rem,1vh,0.625rem)] font-medium text-violet-300/90">プレイヤーのあなたへ</p>
      <div className="flex flex-1 flex-col items-center justify-center py-[clamp(0.25rem,1vh,0.75rem)]">
        <span className="flex h-[clamp(2.5rem,5vh,3rem)] w-[clamp(2.5rem,5vh,3rem)] items-center justify-center rounded-full bg-violet-500/25 text-[clamp(1rem,2vh,1.25rem)] ring-1 ring-violet-400/35">
          🎮
        </span>
        <h3 className="mt-[clamp(0.5rem,1.2vh,0.85rem)] text-center text-[clamp(0.85rem,1.55vh,0.95rem)] font-bold leading-snug text-white">
          プレイヤーとして参加
        </h3>
        <p className="mt-2 max-w-[11rem] flex-1 text-center text-[clamp(0.62rem,1.1vh,0.7rem)] leading-relaxed text-zinc-400">
          ゲームを探してプレイし、開発者にフィードバックを届けましょう。
        </p>
      </div>
      <div className="shrink-0 space-y-2">
        <Link
          href="/"
          className="block rounded-md bg-[#3b82f6] py-[clamp(0.45rem,1vh,0.6rem)] text-center text-[clamp(0.65rem,1.1vh,0.75rem)] font-semibold text-white transition hover:bg-[#2563eb]"
        >
          ゲームを探す
        </Link>
        <Link
          href="/login?mode=signup"
          className="block text-center text-[clamp(0.6rem,1vh,0.68rem)] text-zinc-500 transition hover:text-zinc-300"
        >
          アカウントを作成する
        </Link>
      </div>
    </div>
  );
}

function DeveloperCtaCard() {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-emerald-500/30 bg-[#14141c]/85 p-[clamp(0.75rem,1.6vh,1.1rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
      <p className="text-[clamp(0.58rem,1vh,0.625rem)] font-medium text-emerald-300/90">開発者のあなたへ</p>
      <div className="flex flex-1 flex-col items-center justify-center py-[clamp(0.25rem,1vh,0.75rem)]">
        <span className="flex h-[clamp(2.5rem,5vh,3rem)] w-[clamp(2.5rem,5vh,3rem)] items-center justify-center rounded-full bg-emerald-500/25 text-[clamp(1rem,2vh,1.25rem)] ring-1 ring-emerald-400/35">
          🔧
        </span>
        <h3 className="mt-[clamp(0.5rem,1.2vh,0.85rem)] text-center text-[clamp(0.85rem,1.55vh,0.95rem)] font-bold leading-snug text-white">
          開発者としてはじめる
        </h3>
        <p className="mt-2 max-w-[11rem] flex-1 text-center text-[clamp(0.62rem,1.1vh,0.7rem)] leading-relaxed text-zinc-400">
          あなたのゲームを公開し、プレイヤーと一緒に育てていきましょう。
        </p>
      </div>
      <div className="shrink-0 space-y-2">
        <span
          title="Studio 画面は未実装"
          className="block cursor-not-allowed rounded-md bg-[#10b981] py-[clamp(0.45rem,1vh,0.6rem)] text-center text-[clamp(0.65rem,1.1vh,0.75rem)] font-semibold text-white/95"
        >
          Studioに入る
        </span>
        <Link
          href="/login?mode=signup"
          className="block text-center text-[clamp(0.6rem,1vh,0.68rem)] text-zinc-500 transition hover:text-zinc-300"
        >
          アカウントを作成する
        </Link>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] text-zinc-100 lg:grid lg:h-dvh lg:max-h-dvh lg:grid-rows-[minmax(0,1.08fr)_minmax(0,0.38fr)_auto_auto] lg:overflow-hidden">
      {/* ヒーロー — 画面の主領域 */}
      <section className="relative flex min-h-0 flex-col overflow-hidden">
        <Image
          src="/images/landing-hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-[center_22%] opacity-90"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0a0a0f]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/95 via-[#0a0a0f]/72 to-[#0a0a0f]/38" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/35 via-transparent to-[#0a0a0f]" />

        <header className="relative z-10 shrink-0 border-b border-white/[0.06]">
          <div className="mx-auto flex h-[clamp(2.75rem,6vh,3.25rem)] max-w-[1120px] items-center justify-between px-5 sm:px-6">
            <ForgeLogo />
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md border border-zinc-600/80 px-3 py-1.5 text-[clamp(0.65rem,1.1vh,0.75rem)] font-medium text-zinc-200 transition hover:bg-white/[0.04]"
              >
                ログイン
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-md bg-[#3b82f6] px-3 py-1.5 text-[clamp(0.65rem,1.1vh,0.75rem)] font-semibold text-white transition hover:bg-[#2563eb]"
              >
                新規登録
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1120px] flex-1 flex-col px-5 pb-[clamp(0.75rem,1.8vh,1.25rem)] pt-[clamp(0.5rem,1.4vh,1rem)] sm:px-6">
          <h1 className="shrink-0 text-[clamp(1.65rem,3.6vh,2.15rem)] font-bold leading-[1.12] tracking-tight">
            ゲームを、
            <span className="bg-gradient-to-r from-[#c084fc] via-[#e879f9] to-[#f472b6] bg-clip-text text-transparent">
              育てる
            </span>
            場所。
          </h1>

          <div className="mt-[clamp(0.65rem,1.5vh,1rem)] grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:items-stretch lg:gap-6">
            <div className="flex min-h-0 flex-col">
              <p className="shrink-0 max-w-[520px] text-[clamp(0.78rem,1.55vh,0.875rem)] leading-[1.6] text-zinc-300">
                プレイヤーの声が、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。
              </p>

              <ul className="mt-[clamp(0.65rem,1.4vh,1rem)] flex min-h-0 flex-1 flex-col justify-between">
                {valueProps.map((item) => (
                  <li key={item.title} className="flex gap-2.5">
                    <span
                      className={`flex h-[clamp(1.75rem,3.2vh,2rem)] w-[clamp(1.75rem,3.2vh,2rem)] shrink-0 items-center justify-center rounded-full text-[clamp(0.85rem,1.4vh,1rem)] ring-1 ${item.iconClass}`}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[clamp(0.78rem,1.45vh,0.8125rem)] font-semibold leading-snug text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[clamp(0.68rem,1.2vh,0.6875rem)] leading-relaxed text-zinc-500">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid h-full min-h-[200px] grid-cols-2 gap-2.5 sm:min-h-0 sm:gap-3">
              <PlayerCtaCard />
              <DeveloperCtaCard />
            </div>
          </div>
        </div>
      </section>

      {/* 注目作品 — 残り高さの約4割 */}
      <section className="flex min-h-0 flex-col border-t border-zinc-800/50 bg-[#0a0a0f] px-5 py-[clamp(0.55rem,1.2vh,0.85rem)] sm:px-6">
        <div className="mx-auto flex w-full max-w-[1120px] shrink-0 items-center justify-between gap-3">
          <h2 className="text-[clamp(0.75rem,1.35vh,0.8125rem)] font-bold text-white">注目の開発中ゲーム</h2>
          <Link
            href="/"
            className="text-[clamp(0.65rem,1.1vh,0.6875rem)] text-zinc-500 transition hover:text-zinc-300"
          >
            すべて見る →
          </Link>
        </div>
        <div className="mx-auto mt-[clamp(0.35rem,0.9vh,0.65rem)] grid min-h-0 w-full max-w-[1120px] flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-2.5">
          {featuredGames.map((game) => (
            <FeaturedGameCard key={game.title} game={game} />
          ))}
        </div>
      </section>

      <section className="shrink-0 border-y border-zinc-800/60 bg-[#0d0d12]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-1 px-5 py-[clamp(0.45rem,1vh,0.65rem)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="text-[clamp(0.62rem,1.05vh,0.6875rem)] font-semibold text-white">Forge からのお知らせ</h2>
            <p className="mt-0.5 truncate text-[clamp(0.62rem,1.05vh,0.6875rem)] text-zinc-500">
              2025/05/20 Forge v0.4.0 アップデート… 改善ループの可視化、通知のカスタマイズ など
            </p>
          </div>
          <span className="shrink-0 text-[clamp(0.62rem,1.05vh,0.6875rem)] text-zinc-600">お知らせ一覧 →</span>
        </div>
      </section>

      <footer className="shrink-0 bg-[#0a0a0f] py-[clamp(0.4rem,0.9vh,0.6rem)]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-1.5 px-5 sm:flex-row sm:items-center sm:justify-end sm:gap-5 sm:px-6">
          <nav className="flex flex-wrap gap-x-3.5 gap-y-1 text-[clamp(0.58rem,0.95vh,0.625rem)] text-zinc-600">
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
            <span>ヘルプ</span>
            <span>お問い合わせ</span>
          </nav>
          <p className="text-[clamp(0.58rem,0.95vh,0.625rem)] text-zinc-700">© 2025 Forge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
