import Image from "next/image";
import Link from "next/link";

const valueProps = [
  {
    icon: "💬",
    ring: "ring-violet-500/40 bg-violet-500/10 text-violet-300",
    title: "プレイして、声を届ける",
    body: "あなたのフィードバックがゲームを進化させます。",
  },
  {
    icon: "↗",
    ring: "ring-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    title: "開発の過程から、見届ける",
    body: "開発のストーリーを追いかけ、成長を見守れます。",
  },
  {
    icon: "♥",
    ring: "ring-orange-500/40 bg-orange-500/10 text-orange-300",
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
    hue: "from-indigo-950 via-violet-900 to-slate-900",
  },
  {
    title: "炉心の残光",
    description: "滅びゆく炉心都市で、最後の鍛冶師となって装備を試すアクション。",
    feedback: 18,
    updated: "5日前",
    hue: "from-orange-950 via-amber-900 to-zinc-900",
  },
  {
    title: "浮遊ノート",
    description: "空島を跳び移りながら、失われた旋律を集めるパズル探索。",
    feedback: 11,
    updated: "1日前",
    hue: "from-cyan-950 via-teal-900 to-slate-900",
  },
  {
    title: "夏の向こう側",
    description: "終わらない夏の町で、選択だけが世界の季節を変えていく。",
    feedback: 31,
    updated: "2日前",
    hue: "from-rose-950 via-pink-900 to-zinc-900",
  },
  {
    title: "深淵ノート",
    description: "深海調査船のログを辿り、未知の生態系に触れるサバイバル。",
    feedback: 9,
    updated: "4日前",
    hue: "from-blue-950 via-indigo-950 to-black",
  },
] as const;

function ForgeLogo() {
  return (
    <Link href="/landing" className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-lg shadow-lg shadow-orange-500/20"
      >
        🔥
      </span>
      <span className="text-xl font-bold tracking-tight text-white">Forge</span>
    </Link>
  );
}

function FeaturedGameCard({
  game,
}: {
  game: (typeof featuredGames)[number];
}) {
  return (
    <article className="w-[220px] shrink-0 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm transition hover:border-zinc-700">
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${game.hue}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
      </div>
      <div className="space-y-2 p-3">
        <h3 className="truncate text-sm font-semibold text-white">{game.title}</h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">{game.description}</p>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>💬 {game.feedback}</span>
          <span>🕒 {game.updated}</span>
        </div>
      </div>
    </article>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/5 bg-zinc-950/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <ForgeLogo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900/80"
            >
              ログイン
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              新規登録
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate min-h-[620px] overflow-hidden">
        <Image
          src="/images/landing-hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-zinc-950/55 to-zinc-950" />
        <div className="forge-noise absolute inset-0 opacity-40" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-28 lg:flex-row lg:items-center lg:justify-between lg:pt-32">
          <div className="max-w-xl space-y-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              ゲームを、
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent">
                育てる
              </span>
              場所。
            </h1>
            <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
              プレイヤーの声が、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。
            </p>
          </div>

          <ul className="space-y-4 lg:max-w-sm">
            {valueProps.map((item) => (
              <li
                key={item.title}
                className={`flex gap-4 rounded-xl border border-white/5 bg-zinc-950/50 p-4 ring-1 ${item.ring}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                >
                  {item.icon}
                </span>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative border-y border-zinc-800/80 bg-zinc-950 py-16">
        <div className="forge-hero-grid absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-white">さあ、はじめましょう</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-zinc-900/80 p-6 shadow-xl shadow-violet-950/20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.15),transparent_50%)]" />
              <p className="text-xs font-medium uppercase tracking-wider text-violet-300">
                プレイヤーのあなたへ
              </p>
              <div className="mt-4 flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-xl ring-1 ring-violet-400/40">
                  🎮
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white">プレイヤーとして参加</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    ゲームを探してプレイし、開発者にフィードバックを届けましょう。
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  ゲームを探す
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500"
                >
                  アカウントを作成する
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-900/80 p-6 shadow-xl shadow-emerald-950/20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_50%)]" />
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-300">
                開発者のあなたへ
              </p>
              <div className="mt-4 flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-xl ring-1 ring-emerald-400/40">
                  🔧
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white">開発者としてはじめる</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    あなたのゲームを公開し、プレイヤーと一緒に育てていきましょう。
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <span
                  title="Studio 画面は未実装 — ガワ確認用"
                  className="cursor-not-allowed rounded-lg bg-emerald-600/80 px-5 py-2.5 text-sm font-semibold text-white/90"
                >
                  Studioに入る
                </span>
                <Link
                  href="/login?mode=signup"
                  className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500"
                >
                  アカウントを作成する
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold text-white">注目の開発中ゲーム</h2>
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-white">
            すべて見る →
          </Link>
        </div>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredGames.map((game) => (
            <FeaturedGameCard key={game.title} game={game} />
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Forge からのお知らせ</h2>
            <p className="mt-1 text-sm text-zinc-400">
              2025/05/20 Forge v0.4.0 アップデート… 改善ループの可視化、通知のカスタマイズ など
            </p>
          </div>
          <span className="text-sm text-zinc-500">お知らせ一覧 →（準備中）</span>
        </div>
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-600">© 2025 Forge. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
            <span>ヘルプ</span>
            <span>お問い合わせ</span>
          </nav>
        </div>
      </footer>

      <p className="border-t border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-2 text-center text-[11px] text-zinc-600">
        01 ランディング — モックガワ確認用（/landing）。本番 / は従来の発見ホームのまま。
      </p>
    </div>
  );
}
