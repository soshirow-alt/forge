/** プレイヤーの学習ループ（発見→プレイ→初声→更新を追う）。保存は別軸 — FAQ 参照。 */
export const playerGuideSteps = [
  { label: "作品を探す", description: "気になる作品を検索・発見する" },
  { label: "プレイする", description: "短いサイクルで遊び、感想を持ち帰る" },
  { label: "フィードバックする", description: "感想や気づきを開発者に送る" },
  {
    label: "更新を追う",
    description: "開発ログ・新版・確認依頼の通知を受け取り、変化を見届ける",
  },
] as const;

/** プレイヤーガイド — Studio への導線（開発者向け） */
export const playerGuideStudioEntry = {
  title: "開発者の方へ",
  lead: "作品を投稿・育てる場合は Player 画面とは別の Studio を使います。",
  body:
    "ログイン後、画面右上の Studio ボタンから Studio に移動してください。初回のみ、開発者としての利用開始確認が表示されます。",
  imageSrc: "/images/guide/studio-entry-header.png",
  imageAlt: "Player 画面右上の Studio ボタンの位置",
  caption: "右上：検索バーの右側にある Studio を押す",
} as const;

export const playerGuideFaq = [
  {
    id: "witnessing",
    question: "更新を追っている作品とは？",
    answer:
      "「更新を追う」をオンにした作品の一覧です。開発ログや新版の通知が届き、作品の育ちを確認できます。「見届け人」は正式版到達時の称号で、別の仕組みです。",
  },
  {
    id: "saved",
    question: "保存作品とは？",
    answer:
      "まだプレイする前に、気になった作品をストックできます。上の流れ（プレイ→フィードバック→更新を追う）とは別の、ウィッシュリスト的な機能です。",
  },
  {
    id: "play-history",
    question: "プレイ履歴とは？",
    answer:
      "あなたがプレイしたゲームの記録です。いつ遊んだか、何回プレイしたかを振り返れます。",
  },
  {
    id: "feedback",
    question: "フィードバック履歴とは？",
    answer:
      "あなたが送信したフィードバックの一覧です。改善に反映されたかどうかも確認できます。",
  },
  {
    id: "empathy",
    question: "共感とは？",
    answer:
      "他のプレイヤーがあなたのフィードバックに共感すると、カウントされます。役立つフィードバックが広がりやすくなります。",
  },
  {
    id: "following",
    question: "フォロー中の開発者とは？",
    answer:
      "気になる開発者をフォローすると、新作や更新の動きを追いかけやすくなります。",
  },
] as const;
