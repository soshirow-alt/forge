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
  counterpartInitial: "L",
  projectTitle: "夜明けのBGMパック",
  contextLabel: "BGMの利用について",
  listPreview: "BGMの利用について…",
  listTimeLabel: "サンプル",
  headerBadge: "メッセージ例",
  listBadge: "サンプル",
  messages: [
    {
      id: "s1",
      sender: "counterpart",
      body: "メッセージありがとうございます。\nどのような用途で使う予定でしょうか？",
      createdAtLabel: "昨日 21:10",
    },
    {
      id: "s2",
      sender: "self",
      body: "個人制作のPCゲームで、タイトル画面のBGMとして使用したいです。",
      createdAtLabel: "昨日 21:14",
    },
    {
      id: "s3",
      sender: "counterpart",
      body: "ありがとうございます。\nその用途でしたら利用可能です。クレジット表記についてだけお願いします。",
      createdAtLabel: "昨日 21:18",
    },
  ] as MessagesSampleMessage[],
  composerNote: "これはメッセージ機能のサンプルです",
} as const;

export function isMessagesSampleThreadId(id: string | null | undefined): boolean {
  return id === MESSAGES_SAMPLE_THREAD_ID;
}
