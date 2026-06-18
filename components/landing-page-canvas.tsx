import Image from "next/image";
import Link from "next/link";
import {
  MOCK_CONTENT_W,
  MOCK_CONTENT_X,
  MOCK_CTA,
  MOCK_FEATURED,
  MOCK_FEATURED_CARD_H,
  MOCK_FOOTER,
  MOCK_H1,
  MOCK_HEADER_H,
  MOCK_HERO_BG_H,
  MOCK_H,
  MOCK_LEAD,
  MOCK_LOGIN,
  MOCK_LOGO,
  MOCK_NEWS,
  MOCK_REF_IMAGE_H,
  MOCK_SIGNUP,
  MOCK_VALUES,
  MOCK_W,
} from "@/components/landing-mock-layout";

const valueProps = [
  {
    iconClass: "bg-violet-500/30 text-violet-200 ring-violet-400/45",
    icon: "💬",
    title: "プレイして、声を届ける",
    body: "あなたのフィードバックがゲームを進化させます。",
  },
  {
    iconClass: "bg-emerald-500/30 text-emerald-200 ring-emerald-400/45",
    icon: "📈",
    title: "開発の過程から、見届ける",
    body: "開発のストーリーを追いかけ、成長を見守れます。",
  },
  {
    iconClass: "bg-orange-500/30 text-orange-200 ring-orange-400/45",
    icon: "♥",
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
    thumbClass: "bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-900",
  },
  {
    title: "炉心の残光",
    description: "滅びゆく炉心都市で、最後の鍛冶師となって装備を試すアクション。",
    feedback: 18,
    updated: "5日前",
    thumbClass: "bg-gradient-to-br from-orange-600 via-amber-500 to-orange-900",
  },
  {
    title: "浮遊ノート",
    description: "空島を跳び移りながら、失われた旋律を集めるパズル探索。",
    feedback: 11,
    updated: "1日前",
    thumbClass: "bg-gradient-to-br from-teal-600 via-cyan-500 to-slate-800",
  },
  {
    title: "夏の向こう側",
    description: "終わらない夏の町で、選択だけが世界の季節を変えていく。",
    feedback: 31,
    updated: "2日前",
    thumbClass: "bg-gradient-to-br from-rose-600 via-pink-500 to-fuchsia-900",
  },
  {
    title: "深淵ノート",
    description: "深海調査船のログを辿り、未知の生態系に触れるサバイバル。",
    feedback: 9,
    updated: "4日前",
    thumbClass: "bg-gradient-to-br from-blue-800 via-indigo-700 to-slate-950",
  },
] as const;

function ForgeLogo() {
  return (
    <Link href="/landing" className="flex items-center gap-1.5">
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-[22px] w-[22px] shrink-0">
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
      <span className="text-[15px] font-semibold tracking-tight text-white">Forge</span>
    </Link>
  );
}

function CtaCard({
  accent,
  label,
  icon,
  title,
  body,
  primary,
  primaryClass,
  href,
  x,
}: {
  accent: "violet" | "emerald";
  label: string;
  icon: string;
  title: string;
  body: string;
  primary: string;
  primaryClass: string;
  href?: string;
  x: number;
}) {
  const border = accent === "violet" ? "border-violet-500/35" : "border-emerald-500/35";
  const labelColor = accent === "violet" ? "text-violet-300/90" : "text-emerald-300/90";
  const iconRing = accent === "violet" ? "bg-violet-500/25 ring-violet-400/35" : "bg-emerald-500/25 ring-emerald-400/35";

  return (
    <div
      className={`absolute overflow-hidden rounded-lg border ${border} bg-[#12121a]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[2px]`}
      style={{
        left: x,
        top: MOCK_CTA.y,
        width: MOCK_CTA.w,
        height: MOCK_CTA.h,
        padding: MOCK_CTA.pad,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(255,255,255,0.35) 8px, rgba(255,255,255,0.35) 9px)",
        }}
      />
      <p className={`relative text-[9px] font-medium ${labelColor}`}>{label}</p>
      <div className="relative flex flex-col items-center pt-2">
        <span
          className={`flex items-center justify-center rounded-full text-lg ring-1 ${iconRing}`}
          style={{ width: MOCK_CTA.icon, height: MOCK_CTA.icon }}
        >
          {icon}
        </span>
        <h3
          className="mt-2 text-center font-bold leading-tight text-white"
          style={{ fontSize: MOCK_CTA.titleSize }}
        >
          {title}
        </h3>
        <p
          className="mt-1.5 px-2 text-center leading-snug text-zinc-400"
          style={{ fontSize: MOCK_CTA.bodySize }}
        >
          {body}
        </p>
      </div>
      <div className="absolute bottom-[14px] left-[14px] right-[14px]">
        {href ? (
          <Link
            href={href}
            className={`block rounded-md text-center font-semibold text-white ${primaryClass}`}
            style={{ height: MOCK_CTA.btnH, lineHeight: `${MOCK_CTA.btnH}px`, fontSize: 11 }}
          >
            {primary}
          </Link>
        ) : (
          <span
            title="Studio 画面は未実装"
            className={`block cursor-not-allowed rounded-md text-center font-semibold text-white/95 ${primaryClass}`}
            style={{ height: MOCK_CTA.btnH, lineHeight: `${MOCK_CTA.btnH}px`, fontSize: 11 }}
          >
            {primary}
          </span>
        )}
        <Link
          href="/login?mode=signup"
          className="mt-1.5 block text-center text-[9px] text-zinc-500 hover:text-zinc-300"
        >
          アカウントを作成する
        </Link>
      </div>
    </div>
  );
}

type LandingPageCanvasProps = {
  className?: string;
  /** オーバーレイ比較時 — 下層モックを見せるためヒーロー画像を描かない */
  hideHeroImage?: boolean;
};

/** モック 1024×496 原寸アートボード — 絶対配置模写 */
export function LandingPageCanvas({ className = "", hideHeroImage = false }: LandingPageCanvasProps) {
  const featuredSectionH = MOCK_NEWS.y - MOCK_FEATURED.y;

  return (
    <div
      className={`relative overflow-hidden bg-[#08080c] text-zinc-100 ${className}`}
      style={{ width: MOCK_W, height: MOCK_H }}
    >
      {!hideHeroImage ? (
        <div
          className="pointer-events-none absolute left-0 top-0 overflow-hidden"
          style={{ width: MOCK_W, height: MOCK_HERO_BG_H }}
        >
          <Image
            src="/images/landing-mock-reference.jpg"
            alt=""
            width={MOCK_W}
            height={MOCK_REF_IMAGE_H}
            priority
            className="max-w-none"
            style={{ width: MOCK_W, height: MOCK_REF_IMAGE_H }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080c]/92 via-[#08080c]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08080c]/25 via-transparent to-[#08080c]" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute left-0 top-0 bg-gradient-to-r from-[#08080c]/80 via-transparent to-transparent"
          style={{ width: MOCK_W, height: MOCK_HERO_BG_H }}
        />
      )}

      <header
        className="absolute left-0 top-0 z-20 border-b border-white/[0.06]"
        style={{ width: MOCK_W, height: MOCK_HEADER_H }}
      />

      <div className="absolute z-30" style={{ left: MOCK_LOGO.x, top: MOCK_LOGO.y }}>
        <ForgeLogo />
      </div>

      <Link
        href="/login"
        className="absolute z-30 flex items-center justify-center rounded border border-zinc-600/80 text-[10px] font-medium text-zinc-200 hover:bg-white/[0.04]"
        style={{ left: MOCK_LOGIN.x, top: MOCK_LOGIN.y, width: MOCK_LOGIN.w, height: MOCK_LOGIN.h }}
      >
        ログイン
      </Link>
      <Link
        href="/login?mode=signup"
        className="absolute z-30 flex items-center justify-center rounded bg-[#3b82f6] text-[10px] font-semibold text-white hover:bg-[#2563eb]"
        style={{ left: MOCK_SIGNUP.x, top: MOCK_SIGNUP.y, width: MOCK_SIGNUP.w, height: MOCK_SIGNUP.h }}
      >
        新規登録
      </Link>

      <h1
        className="absolute z-20 font-bold tracking-tight"
        style={{
          left: MOCK_H1.x,
          top: MOCK_H1.y,
          fontSize: MOCK_H1.size,
          lineHeight: `${MOCK_H1.lineHeight}px`,
        }}
      >
        ゲームを、
        <span className="bg-gradient-to-r from-[#c084fc] via-[#e879f9] to-[#f472b6] bg-clip-text text-transparent">
          育てる
        </span>
        場所。
      </h1>

      <p
        className="absolute z-20 text-zinc-300"
        style={{
          left: MOCK_LEAD.x,
          top: MOCK_LEAD.y,
          width: MOCK_LEAD.w,
          fontSize: MOCK_LEAD.size,
          lineHeight: `${MOCK_LEAD.lineHeight}px`,
        }}
      >
        プレイヤーの声が、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。
      </p>

      {valueProps.map((item, index) => {
        const rowH = 36;
        const y = MOCK_VALUES.y + index * (rowH + MOCK_VALUES.rowGap);
        return (
          <div key={item.title} className="absolute z-20 flex gap-2" style={{ left: MOCK_VALUES.x, top: y }}>
            <span
              className={`flex shrink-0 items-center justify-center rounded-full text-[11px] ring-1 ${item.iconClass}`}
              style={{ width: MOCK_VALUES.icon, height: MOCK_VALUES.icon }}
            >
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-none text-white" style={{ fontSize: MOCK_VALUES.titleSize }}>
                {item.title}
              </p>
              <p
                className="mt-1 text-zinc-500"
                style={{ fontSize: MOCK_VALUES.bodySize, lineHeight: `${MOCK_VALUES.bodyLineHeight}px` }}
              >
                {item.body}
              </p>
            </div>
          </div>
        );
      })}

      <CtaCard
        accent="violet"
        label="プレイヤーのあなたへ"
        icon="🎮"
        title="プレイヤーとして参加"
        body="ゲームを探してプレイし、開発者にフィードバックを届けましょう。"
        primary="ゲームを探す"
        primaryClass="bg-[#3b82f6] hover:bg-[#2563eb]"
        href="/"
        x={MOCK_CTA.leftX}
      />
      <CtaCard
        accent="emerald"
        label="開発者のあなたへ"
        icon="🔧"
        title="開発者としてはじめる"
        body="あなたのゲームを公開し、プレイヤーと一緒に育てていきましょう。"
        primary="Studioに入る"
        primaryClass="bg-[#10b981]"
        x={MOCK_CTA.rightX}
      />

      {/* 注目作品 — カード高はモック基準。セクション高 = お知らせ手前まで */}
      <section
        className="absolute left-0 z-10 border-t border-zinc-800/55 bg-[#08080c]"
        style={{ top: MOCK_FEATURED.y, width: MOCK_W, height: featuredSectionH }}
      >
        <div
          className="absolute flex items-center justify-between"
          style={{ left: MOCK_CONTENT_X, top: MOCK_FEATURED.titleY - MOCK_FEATURED.y, width: MOCK_CONTENT_W }}
        >
          <h2 className="font-bold text-white" style={{ fontSize: MOCK_FEATURED.titleSize }}>
            注目の開発中ゲーム
          </h2>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300" style={{ fontSize: MOCK_FEATURED.bodySize }}>
            すべて見る →
          </Link>
        </div>

        {featuredGames.map((game, index) => {
          const x = MOCK_CONTENT_X + index * (MOCK_FEATURED.cardW + MOCK_FEATURED.gap);
          const y = MOCK_FEATURED.cardsY - MOCK_FEATURED.y;
          return (
            <article
              key={game.title}
              className="absolute overflow-hidden rounded-[5px] border border-zinc-800/60 bg-[#101016]"
              style={{ left: x, top: y, width: MOCK_FEATURED.cardW, height: MOCK_FEATURED_CARD_H }}
            >
              <div className={game.thumbClass} style={{ height: MOCK_FEATURED.thumbH }} />
              <div
                className="space-y-0.5"
                style={{ padding: MOCK_FEATURED.metaPad, minHeight: MOCK_FEATURED.metaBodyMinH }}
              >
                <h3 className="truncate font-semibold text-white" style={{ fontSize: MOCK_FEATURED.titleSize }}>
                  {game.title}
                </h3>
                <p
                  className="line-clamp-1 text-zinc-500"
                  style={{ fontSize: MOCK_FEATURED.bodySize, lineHeight: "12px" }}
                >
                  {game.description}
                </p>
                <div className="flex gap-2 text-violet-400/90" style={{ fontSize: MOCK_FEATURED.statsSize }}>
                  <span>💬 {game.feedback}</span>
                  <span className="text-zinc-500">🕒 {game.updated}</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* お知らせ — 作品カード下端 + gap から開始 */}
      <section
        className="absolute left-0 z-20 border-y border-zinc-800/60 bg-[#0c0c12]"
        style={{ top: MOCK_NEWS.y, width: MOCK_W, height: MOCK_NEWS.h }}
      >
        <div
          className="flex h-full items-center justify-between"
          style={{ paddingLeft: MOCK_NEWS.padX, paddingRight: MOCK_NEWS.padX }}
        >
          <div className="min-w-0">
            <h2 className="font-semibold leading-none text-white" style={{ fontSize: MOCK_NEWS.titleSize }}>
              Forge からのお知らせ
            </h2>
            <p className="truncate text-zinc-500" style={{ fontSize: MOCK_NEWS.bodySize }}>
              2025/05/20 Forge v0.4.0 アップデート… 改善ループの可視化、通知のカスタマイズ など
            </p>
          </div>
          <span className="shrink-0 text-zinc-600" style={{ fontSize: MOCK_NEWS.bodySize }}>
            お知らせ一覧 →
          </span>
        </div>
      </section>

      {/* フッター — お知らせ直下 */}
      <footer
        className="absolute left-0 z-20 bg-[#08080c]"
        style={{ top: MOCK_FOOTER.y, width: MOCK_W, height: MOCK_FOOTER.h }}
      >
        <div
          className="flex h-full items-center justify-end gap-4"
          style={{ paddingLeft: MOCK_FOOTER.padX, paddingRight: MOCK_FOOTER.padX }}
        >
          <nav className="flex gap-3 text-zinc-600" style={{ fontSize: MOCK_FOOTER.size }}>
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
            <span>ヘルプ</span>
            <span>お問い合わせ</span>
          </nav>
          <p className="text-zinc-700" style={{ fontSize: MOCK_FOOTER.size }}>
            © 2025 Forge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** オーバーレイ用 — ヒーロー画像なし（下層モック 50% を見せる） */
export function LandingPageCanvasCompare() {
  return <LandingPageCanvas hideHeroImage />;
}

export { ForgeLogo, featuredGames, valueProps };
