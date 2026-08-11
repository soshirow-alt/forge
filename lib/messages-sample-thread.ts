/**
 * Production-safe UI-only sample message thread.
 * Never persisted to DB / auth / notifications / email.
 */

export const MESSAGES_SAMPLE_THREAD_ID = "sample-lumen-audio";

export type MessagesSampleMessage = {
  id: string;
  sender: "counterpart" | "self";
  body: string;
  createdAtLabel: string;
};

export const MESSAGES_SAMPLE_THREAD = {
  id: MESSAGES_SAMPLE_THREAD_ID,
  counterpartName: "Lumen Audio",
  counterpartAvatarSrc: "/messages-sample/lumen-audio-avatar.svg",
  selfAvatarSrc: "/messages-sample/self-avatar.svg",
  projectTitle: "夜明けのBGMパック",
  purpose: "use_their_work" as const,
  purposeLabel: "この作品を利用したい",
  ownProjectTitle: "星巡りの冒険",
  listPreview: "はじめまして。個人制作中のPCゲーム『星巡りの冒険』の…",
  listBadge: "サンプル",
  headerBadge: "メッセージ例",
  context: {
    heading: "この作品について相談",
    purpose: "use_their_work" as const,
    projectTitle: "夜明けのBGMパック",
    creatorName: "Lumen Audio",
    ownProjectTitle: "星巡りの冒険",
  },
  messages: [
    {
      id: "s1",
      sender: "self",
      body: "はじめまして。\n個人制作中のPCゲーム『星巡りの冒険』のタイトル画面で、『夜明けのBGMパック』の楽曲を使いたいと考えています。\n利用条件を教えていただけますか？",
      createdAtLabel: "昨日 21:10",
    },
    {
      id: "s2",
      sender: "counterpart",
      body: "お問い合わせありがとうございます。\n個人制作の作品であればご利用可能です。公開時にクレジット表記をお願いします。",
      createdAtLabel: "昨日 21:14",
    },
    {
      id: "s3",
      sender: "self",
      body: "ありがとうございます。\nクレジットはどのように記載すればよいでしょうか？",
      createdAtLabel: "昨日 21:16",
    },
    {
      id: "s4",
      sender: "counterpart",
      body: "『BGM: Lumen Audio（夜明けのBGMパック）』のように記載いただければ大丈夫です。",
      createdAtLabel: "昨日 21:18",
    },
  ] as MessagesSampleMessage[],
  composerNote:
    "作品詳細の「利用・コラボについてメッセージ」から、作品についての相談を始められます。\nこれはメッセージ機能のサンプルです",
} as const;

export function isMessagesSampleThreadId(id: string | null | undefined): boolean {
  return id === MESSAGES_SAMPLE_THREAD_ID;
}
