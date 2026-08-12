import {
  FIRST_GUIDE_CATEGORY_LABELS,
  type FirstGuideCta,
} from "@/lib/player-guide-v0-content";

export type StudioGuideCta = FirstGuideCta;

export type StudioGuideStep = {
  id: string;
  title: string;
  body: readonly string[];
  chips?: readonly string[];
  bullets?: readonly string[];
  note?: string;
  ctas?: readonly StudioGuideCta[];
};

/** First-time /studio/guide. Complementary to Player /guide — not a second copy. */
export const studioGuideIntro = {
  title: "はじめてガイド",
  lead: "Studio では、クリエイターが作品を掲載し、フィードバックを受け取り、更新します。",
  playerGuideHref: "/guide",
  playerGuideLabel: "はじめてガイド",
  rolePlayer: "Player — 見つける / 試す / フィードバック / つながる",
  roleStudio: "Studio — 掲載する / 受け取る / 更新する / つながる",
} as const;

export const studioGuideSteps: readonly StudioGuideStep[] = [
  {
    id: "publish",
    title: "作品を掲載する",
    body: [
      "5つのカテゴリから1つ選び、作品情報を書いて、準備ができたら公開します。",
    ],
    chips: [...FIRST_GUIDE_CATEGORY_LABELS],
    bullets: ["Studio → 新規投稿 → カテゴリ専用フォーム → 公開"],
    ctas: [{ href: "/studio/submit", label: "新規投稿", kind: "primary" }],
  },
  {
    id: "feedback",
    title: "フィードバックを受け取る",
    body: ["届いたフィードバックを読み、改善や次の更新の材料にします。"],
    bullets: [
      "試した人からのフィードバックを確認する",
      "次に直すこと・伝えることに使う",
    ],
    ctas: [{ href: "/studio/mypage", label: "作品一覧", kind: "secondary" }],
  },
  {
    id: "update",
    title: "作品を更新する",
    body: ["作品が変わったら、作品情報や更新内容を直して公開します。"],
    bullets: [
      "バージョンやリリースの機能は、カテゴリによって異なります",
      "すべての作品で新バージョン公開が必須ではありません",
    ],
    note: "正式版になったら公開状態も更新できます。",
    ctas: [{ href: "/studio/mypage", label: "作品を管理", kind: "secondary" }],
  },
  {
    id: "connect",
    title: "作品からつながる",
    body: [
      "Studio からもメッセージの閲覧・返信ができます。Player のメッセージと同じやり取りです。",
    ],
    bullets: [
      "メッセージ — 利用やコラボの相談など",
      "利用・コラボ相談 — 目的と関連作品を指定して始める非公開の相談",
      "作品同士の使用関係 — Forge 上で確認・承認する",
    ],
    note: "使用関係の承認は、ライセンスや著作権の譲渡、報酬契約そのものではありません。",
    ctas: [
      { href: "/studio/messages", label: "メッセージ", kind: "primary" },
      { href: "/usage-relations", label: "使用関係", kind: "secondary" },
      { href: "/terms", label: "利用規約", kind: "secondary" },
    ],
  },
] as const;

/** Pathnames used by /studio/guide CTAs — must exist as App Router pages. */
export const STUDIO_GUIDE_ROUTE_PATHS = [
  "/guide",
  "/studio/submit",
  "/studio/messages",
  "/studio/mypage",
  "/usage-relations",
  "/terms",
] as const;
