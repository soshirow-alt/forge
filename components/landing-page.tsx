import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Flame,
  Gamepad2,
  Heart,
  MessageSquare,
  TrendingUp,
  Wrench,
} from "lucide-react";

const valueProps = [
  {
    icon: MessageSquare,
    iconClass: "bg-violet-500/20 text-violet-300",
    title: "プレイして、声を届ける",
    body: "あなたのフィードバックがゲームを進化させます。",
  },
  {
    icon: TrendingUp,
    iconClass: "bg-emerald-500/20 text-emerald-300",
    title: "開発の過程から、見届ける",
    body: "開発のストーリーを追いかけ、成長を見守れます。",
  },
  {
    icon: Heart,
    iconClass: "bg-amber-500/20 text-amber-300",
    title: "一緒に、最高の体験をつくる",
    body: "開発者とプレイヤーがつながり、\nまだ見ぬ名作が生まれていきます。",
  },
] as const;

const featuredGames = [
  {
    title: "星灯の旅路",
    description: "夜の森を旅する短編アドベンチャー",
    feedback: 12,
    updated: "3日",
    image: "/images/landing/game-1.png",
  },
  {
    title: "炉心の残光",
    description: "心の奥に残る、静かな物語",
    feedback: 8,
    updated: "5日",
    image: "/images/landing/game-2.png",
  },
  {
    title: "浮遊ノート",
    description: "空に浮かぶ島々をめぐる記録",
    feedback: 23,
    updated: "7日",
    image: "/images/landing/game-3.png",
  },
  {
    title: "夏の向こう側",
    description: "あの夏の記憶を、もう一度",
    feedback: 15,
    updated: "2日",
    image: "/images/landing/game-4.png",
  },
  {
    title: "深淵ノート",
    description: "失われた記憶を辿るRPG",
    feedback: 31,
    updated: "10日",
    image: "/images/landing/game-5.png",
  },
] as const;

function ForgeLogo() {
  return (
    <Link href="/landing" className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-zinc-950 shadow-lg shadow-white/20">
        <Flame className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xl font-bold tracking-tight text-white">Forge</span>
    </Link>
  );
}

function CtaCard({
  accent,
  label,
  icon: Icon,
  title,
  body,
  primaryLabel,
  primaryHref,
  primaryClass,
  secondaryHref,
}: {
  accent: "player" | "developer";
  label: string;
  icon: typeof Gamepad2;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref?: string;
  primaryClass: string;
  secondaryHref: string;
}) {
  const border =
    accent === "player" ? "border-violet-500/30" : "border-emerald-500/30";
  const labelClass =
    accent === "player" ? "bg-violet-500/25 text-violet-100" : "bg-emerald-500/25 text-emerald-100";
  const glow =
    accent === "player"
      ? "from-violet-500/25 to-transparent"
      : "from-emerald-500/25 to-transparent";
  const ring =
    accent === "player" ? "ring-violet-500/40 bg-violet-600 text-white" : "ring-emerald-500/40 bg-emerald-600 text-white";

  return (
    <div
      className={`relative flex flex-col items-center overflow-hidden rounded-2xl border ${border} bg-zinc-900/60 px-7 pb-8 pt-7 text-center backdrop-blur-md`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b ${glow}`}
      />
      <span className={`relative inline-flex rounded-full px-4 py-1.5 text-xs font-medium ${labelClass}`}>
        {label}
      </span>
      <span
        className={`relative mt-10 flex size-20 items-center justify-center rounded-full ring-8 ${ring}`}
      >
        <Icon className="size-9" aria-hidden="true" />
      </span>
      <h3 className="relative mt-9 text-2xl font-bold text-white">{title}</h3>
      <p className="relative mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
        {body}
      </p>
      {primaryHref ? (
        <Link
          href={primaryHref}
          className={`relative mt-7 w-full rounded-xl py-3.5 text-sm font-semibold shadow-lg transition-[filter] hover:brightness-110 ${primaryClass}`}
        >
          {primaryLabel}
        </Link>
      ) : (
        <span
          title="Studio 画面は未実装"
          className={`relative mt-7 w-full cursor-not-allowed rounded-xl py-3.5 text-sm font-semibold opacity-90 ${primaryClass}`}
        >
          {primaryLabel}
        </span>
      )}
      <Link
        href={secondaryHref}
        className="relative mt-5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-200"
      >
        アカウントを作成する
      </Link>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 sm:px-8">
          <ForgeLogo />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-zinc-700 bg-zinc-950/40 px-4 py-2.5 text-sm font-medium text-zinc-100 backdrop-blur-sm transition-colors hover:bg-zinc-900/70 sm:px-5"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-white/20 transition-[filter] hover:brightness-110 sm:px-5"
            >
              新規登録
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/landing/hero-bg.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40" />
        </div>

        <div className="relative mx-auto max-w-[1320px] px-6 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-36">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,760px)] lg:gap-12">
            <div className="max-w-xl pt-4">
              <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl">
                ゲームを、
                <span className="text-violet-300">育てる</span>
                <span className="whitespace-nowrap">場所。</span>
              </h1>
              <div className="mt-6 space-y-1 text-base leading-relaxed text-zinc-300 sm:mt-8 sm:text-lg">
                <p>プレイヤーの声が、次の物語をつくる。</p>
                <p>開発者とプレイヤーが一緒に、</p>
                <p>最高のゲーム体験を育てていくプラットフォーム。</p>
              </div>
              <ul className="mt-10 space-y-6 sm:mt-12 sm:space-y-7">
                {valueProps.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex gap-4">
                      <span
                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-500">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <p className="mb-5 text-base font-medium text-zinc-300 lg:text-right">
                さあ、はじめましょう
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <CtaCard
                  accent="player"
                  label="プレイヤーのあなたへ"
                  icon={Gamepad2}
                  title="プレイヤーとして参加"
                  body={"ゲームを探してプレイし、\n開発者にフィードバックを届けましょう。"}
                  primaryLabel="ゲームを探す"
                  primaryHref="/"
                  primaryClass="bg-white text-zinc-950 shadow-white/20"
                  secondaryHref="/register"
                />
                <CtaCard
                  accent="developer"
                  label="開発者のあなたへ"
                  icon={Wrench}
                  title="開発者としてはじめる"
                  body={"あなたのゲームを公開し、\nプレイヤーと一緒に育てていきましょう。"}
                  primaryLabel="Studioに入る"
                  primaryClass="bg-emerald-500 text-zinc-950 shadow-emerald-500/30"
                  secondaryHref="/register"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-12 sm:px-8 sm:py-14">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">注目の開発中ゲーム</h2>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-violet-300 transition-colors hover:text-violet-200"
          >
            すべて見る
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
          {featuredGames.map((game) => (
            <Link
              key={game.title}
              href="/"
              className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition-colors hover:border-violet-500/40"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={game.image}
                  alt={game.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white">{game.title}</h3>
                <p className="mt-1.5 line-clamp-1 text-sm text-zinc-500">{game.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="size-3.5 text-violet-400" aria-hidden="true" />
                    {game.feedback}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {game.updated}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-[1320px] px-6 pb-10 sm:px-8 sm:pb-12">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-bold text-white">Forge からのお知らせ</h2>
            <span
              title="お知らせ一覧は準備中"
              className="flex cursor-not-allowed items-center gap-1.5 text-sm font-medium text-zinc-500"
            >
              お知らせ一覧
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            <span className="text-zinc-400">2025/05/20</span>
            <span className="ml-3 text-zinc-300 sm:ml-5">
              Forge v0.4.0 アップデートを公開しました！
            </span>
            <span className="mt-1 block sm:ml-5 sm:mt-0 sm:inline">
              新機能：改善ループの可視化、通知のカスタマイズ など
            </span>
          </p>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <p className="md:order-1">© 2025 Forge. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-6 md:order-2 md:gap-8">
            <span className="text-zinc-600">利用規約</span>
            <span className="text-zinc-600">プライバシーポリシー</span>
            <span className="text-zinc-600">ヘルプ</span>
            <span className="text-zinc-600">お問い合わせ</span>
          </nav>
        </div>
      </footer>
    </main>
  );
}
