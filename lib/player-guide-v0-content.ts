import { PROJECT_CATEGORY_LABELS } from "@/lib/project-categories";

/** Visible category labels on /guide — never show internal key `service-app`. */
export const FIRST_GUIDE_CATEGORY_LABELS = [
  PROJECT_CATEGORY_LABELS.game,
  PROJECT_CATEGORY_LABELS.audio,
  PROJECT_CATEGORY_LABELS.asset,
  PROJECT_CATEGORY_LABELS["dev-tool"],
  PROJECT_CATEGORY_LABELS["service-app"],
] as const;

export type FirstGuideCta = {
  href: string;
  label: string;
  kind: "primary" | "secondary";
};

export type FirstGuideSection = {
  id: string;
  title: string;
  body: readonly string[];
  bullets?: readonly string[];
  note?: string;
  ctas?: readonly FirstGuideCta[];
};

/**
 * First-time /guide. Copy follows Production/final code, not a wish list.
 * Guest feedback is disabled when VERCEL_ENV=production.
 */
export const firstGuideIntro = {
  title: "はじめてガイド",
  lead: "Forge で作品を見つけ、試し、フィードバックする。初めての人向けです。",
} as const;

export const firstGuideSections: readonly FirstGuideSection[] = [
  {
    id: "what-is-forge",
    title: "Forgeとは",
    body: [
      "Forge は、完成前の作品を見つけて試し、フィードバックを残す場所です。",
      "ゲームだけでなく、次の5つのカテゴリの作品があります。",
    ],
    bullets: [...FIRST_GUIDE_CATEGORY_LABELS],
    note: "試したあとに、メッセージや利用・コラボの相談へ進むこともできます。クリエイター同士だけの場所ではありません。",
    ctas: [{ href: "/home", label: "ホームを見る", kind: "primary" }],
  },
  {
    id: "find",
    title: "気になる作品を見つける",
    body: [
      "探す入口はホームと検索です。ログインしなくても閲覧できます。",
    ],
    bullets: [
      "ホーム — フィードバックが集まっている作品や、カテゴリごとの入口",
      "作品を探す — 5カテゴリのタブと条件で探す",
      "カテゴリHome — そのカテゴリに公開作品があるとき、注目作品をまとめて見られる",
      "クリエイターを探す — 人から作品をたどる",
    ],
    note: "公開作品があるカテゴリでは、カテゴリHomeで注目作品を見られます。まだ少ないカテゴリは検索から探してください。",
    ctas: [
      { href: "/home", label: "ホーム", kind: "primary" },
      { href: "/search", label: "作品を探す", kind: "secondary" },
      { href: "/search/creators", label: "クリエイターを探す", kind: "secondary" },
    ],
  },
  {
    id: "try-feedback",
    title: "試して、フィードバックする",
    body: [
      "Forge の中心は、作品を試してフィードバックを残すことです。クリエイターでなくても、試してフィードバックする人が中心の利用者です。",
      "作品ページのボタンから試せます。ゲームなら遊ぶ、音なら聴く、ツールやサービスなら使う、などカテゴリごとに呼び方は違います。",
      "フィードバックの送信にはログインが必要です。ボタンは隠さず、未ログインならログインへ進みます。",
    ],
    bullets: [
      "試すこと自体は、公開中の作品ならログイン前でもできます",
      "フィードバックはログイン後に、そのバージョンへ残ります",
      "気に入ったら「更新を追う」で、次のバージョンの動きを受け取れます",
    ],
    note: "ゲストのままフィードバックを送ることは、現在の本番ではできません。",
    ctas: [{ href: "/search", label: "作品を探して試す", kind: "primary" }],
  },
  {
    id: "publish",
    title: "作品を掲載する",
    body: [
      "自分の作品を載せるときは Studio を使います。ログイン後、画面右上の Studio から入れます。",
      "新規投稿は、まずカテゴリを選んでから、そのカテゴリ用のフォームへ進みます。公開や更新も Studio で行います。",
    ],
    bullets: [
      "ゲーム / 音楽・音声 / アセット / 開発ツール / サービス",
      "カテゴリを選ぶ → 専用フォーム → 公開・更新",
    ],
    note: "ゲーム以外のカテゴリも、同じ「新規投稿」から始めます。",
    ctas: [
      { href: "/studio/submit", label: "新規投稿", kind: "primary" },
      { href: "/studio", label: "Studio", kind: "secondary" },
    ],
  },
  {
    id: "connect",
    title: "作品からつながる",
    body: [
      "気になったクリエイターや作品があれば、その先でつながれます。",
    ],
    bullets: [
      "メッセージ — 利用やコラボの相談など、相手とのやり取り",
      "利用・コラボ相談 — 目的と関連作品を指定して始める非公開の相談",
      "使用関係 — 作品同士の利用について、Forge 上で確認・承認する",
    ],
    note: "Forge 上の使用関係の承認は、ライセンスや著作権の譲渡、報酬契約そのものではありません。くわしくは利用規約を見てください。",
    ctas: [
      { href: "/messages", label: "メッセージ", kind: "primary" },
      { href: "/usage-relations", label: "使用関係", kind: "secondary" },
      { href: "/terms", label: "利用規約", kind: "secondary" },
    ],
  },
  {
    id: "reciprocity",
    title: "フィードバックが次につながる",
    body: [
      "ログインした人が他の作品へフィードバックし、自分にも公開中の作品があるとき、相手側にあなたの作品を見てもらう案内が届くことがあります。",
      "ポイントやクレジット、必ずお返ししなければならない仕組みではありません。次の発見のきっかけです。",
    ],
  },
  {
    id: "player-studio",
    title: "PlayerとStudio",
    body: [
      "同じアカウントで、見る側と載せる側を行き来できます。",
    ],
    bullets: [
      "Player — 見つける / 試す / フィードバック / メッセージ",
      "Studio — 自分の作品を掲載・管理し、届いた相談やメッセージを見る",
    ],
    note: "Player のメッセージと Studio のメッセージは、別の会話ではありません。同じやり取りを、見る場所が違うだけです。",
    ctas: [
      { href: "/home", label: "Player ホーム", kind: "secondary" },
      { href: "/studio", label: "Studio", kind: "secondary" },
      { href: "/messages", label: "メッセージ", kind: "primary" },
    ],
  },
] as const;

/** Studio screenshot still helps first-time publishers find the header switch. */
export const playerGuideStudioEntry = {
  title: "Studio の入り方",
  lead: "作品を掲載・管理する画面は Studio です。",
  body: "ログイン後、画面右上の Studio から移動できます。",
  imageSrc: "/images/guide/studio-entry-header.png",
  imageAlt: "画面右上の Studio ボタンの位置",
  caption: "右上：検索の右側にある Studio を押す",
} as const;

/** Pathnames used by /guide CTAs — must exist as App Router pages. */
export const FIRST_GUIDE_ROUTE_PATHS = [
  "/home",
  "/search",
  "/search/creators",
  "/home/game",
  "/home/dev-tool",
  "/studio",
  "/studio/submit",
  "/studio/messages",
  "/messages",
  "/usage-relations",
  "/terms",
  "/mypage",
] as const;
