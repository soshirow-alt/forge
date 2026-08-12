import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Flame,
  Gamepad2,
  Heart,
  MessageSquare,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/legal-routes";
import { LandingFeaturedGamesSection } from "@/components/landing-featured-games-section";
import { LandingGuestEntryButton } from "@/components/landing-guest-entry-button";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";
import type { LandingFeaturedGame } from "@/lib/landing-featured-games";
import { PROJECT_CATEGORY_LABELS } from "@/lib/project-categories";

const valueProps = [
  {
    icon: MessageSquare,
    iconClass: "bg-violet-500/20 text-violet-300",
    title: "見つけて、試す",
    body: "まだ知られていない作品を見つけ、遊ぶ・聴く・使う。",
  },
  {
    icon: TrendingUp,
    iconClass: "bg-emerald-500/20 text-emerald-300",
    title: "感じたことを、届ける",
    body: "試して感じたことを、フィードバックとしてクリエイターへ。",
  },
  {
    icon: Heart,
    iconClass: "bg-amber-500/20 text-amber-300",
    title: "作品から、つながる",
    body: "更新を追い、利用やコラボ、新しい作品との出会いへ。",
  },
] as const;

/** LP-only category blurb — labels from PROJECT_CATEGORY_LABELS. */
const landingCategories = [
  {
    id: "game" as const,
    blurb: "遊んで、感じたことを届ける",
  },
  {
    id: "audio" as const,
    blurb: "聴いて、作品や制作につなげる",
  },
  {
    id: "asset" as const,
    blurb: "見つけて、制作に活かす",
  },
  {
    id: "dev-tool" as const,
    blurb: "試して、制作をもっと良くする",
  },
  {
    id: "service-app" as const,
    blurb: "使って、反応を届ける",
  },
] as const;

function ForgeLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
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
  secondary,
}: {
  accent: "player" | "developer";
  label: string;
  icon: typeof Gamepad2;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref?: string;
  primaryClass: string;
  secondary?: ReactNode;
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
      {secondary}
    </div>
  );
}

export function LandingPage({
  logoHref = "/",
  featuredGames,
  useMockContent = false,
}: {
  logoHref?: string;
  featuredGames: LandingFeaturedGame[];
  useMockContent?: boolean;
}) {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-6 sm:px-8">
          <ForgeLogo href={logoHref} />
          <nav className="flex items-center gap-3">
            <LandingGuestEntryButton className="hidden rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900/70 hover:text-white sm:inline-flex" />
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
                作品を、
                <span className="text-violet-300">育てる</span>
                <span className="whitespace-nowrap">場所。</span>
              </h1>
              <div className="mt-6 space-y-1 text-base leading-relaxed text-zinc-300 sm:mt-8 sm:text-lg">
                <p>作品を見つけて、試して、感じたことを届ける。</p>
                <p>そこから、作品の変化や新しいつながりが生まれる。</p>
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
                  label="作品を楽しむあなたへ"
                  icon={Gamepad2}
                  title="作品を見つける"
                  body={"気になる作品を見つけて試し、\n感じたことを届けましょう。"}
                  primaryLabel="作品を探す"
                  primaryHref={buildLoginUrlWithReturn("/home")}
                  primaryClass="bg-white text-zinc-950 shadow-white/20"
                />
                <CtaCard
                  accent="developer"
                  label="クリエイターのあなたへ"
                  icon={Wrench}
                  title="作品を掲載する"
                  body={"あなたの作品を公開し、\n試してくれる人と一緒に育てていきましょう。"}
                  primaryLabel="Studioに入る"
                  primaryHref={buildLoginUrlWithReturn("/studio")}
                  primaryClass="bg-emerald-500 text-zinc-950 shadow-emerald-500/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-12 sm:px-8 sm:py-14">
        <h2 className="text-xl font-bold text-white">いろんな作品が、Forgeに。</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
          {landingCategories.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-5"
            >
              <p className="font-semibold text-white">
                {PROJECT_CATEGORY_LABELS[item.id]}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {item.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      <LandingFeaturedGamesSection games={featuredGames} useMockContent={useMockContent} />

      <footer className="mx-auto max-w-[1320px] px-6 pb-10 sm:px-8 sm:pb-12">
        {useMockContent && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-white">Forge からのお知らせ</h2>
              <span
                title="お知らせ一覧は Coming Soon"
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
        )}
        <div
          className={`flex flex-col items-center justify-between gap-4 text-sm text-zinc-500 md:flex-row ${useMockContent ? "mt-10" : ""}`}
        >
          <p className="md:order-1">© 2026 Forge. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-6 md:order-2 md:gap-8">
            <Link href={TERMS_PATH} className="transition-colors hover:text-zinc-300">
              利用規約
            </Link>
            <Link href={PRIVACY_PATH} className="transition-colors hover:text-zinc-300">
              プライバシーポリシー
            </Link>
            <span className="text-zinc-600">ヘルプ</span>
            <span className="text-zinc-600">お問い合わせ</span>
          </nav>
        </div>
      </footer>
    </main>
  );
}
