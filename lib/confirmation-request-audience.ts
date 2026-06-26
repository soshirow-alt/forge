/** 確認依頼の通知対象（任意・複数選択可） */

export type ConfirmationNotifyAudienceKey =
  | "prior_players"
  | "related_feedback"
  | "watchers"
  | "bookmarks"
  | "all";

export type ConfirmationNotifyAudienceOption = {
  key: ConfirmationNotifyAudienceKey;
  label: string;
  description: string;
};

export const CONFIRMATION_NOTIFY_AUDIENCE_OPTIONS: ConfirmationNotifyAudienceOption[] =
  [
    {
      key: "prior_players",
      label: "前verを遊んだ人",
      description: "この作品を一度以上プレイした人",
    },
    {
      key: "related_feedback",
      label: "関連FBを送った人",
      description: "紐付けた課題に関係するFBを送った人（未選択時は全FB）",
    },
    {
      key: "watchers",
      label: "見届け中の人",
      description: "見届け登録している人",
    },
    {
      key: "bookmarks",
      label: "保存している人",
      description: "作品を保存している人",
    },
    {
      key: "all",
      label: "上記すべて",
      description: "プレイ・FB・見届け・保存のいずれかに該当する人",
    },
  ];

export const DEFAULT_CONFIRMATION_NOTIFY_AUDIENCE: ConfirmationNotifyAudienceKey[] =
  ["prior_players", "watchers"];
