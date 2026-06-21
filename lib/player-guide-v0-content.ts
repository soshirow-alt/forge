export const playerGuideSteps = [
  { label: "作品を探す", description: "気になる作品を検索・発見する" },
  { label: "プレイする", description: "短いサイクルで遊び、感想を持ち帰る" },
  { label: "フィードバックする", description: "感想や気づきを開発者に送る" },
  { label: "見届ける", description: "更新や改善の変化を追いかける" },
  { label: "保存する", description: "あとで遊びたい作品をストックする" },
] as const;

export const playerGuideFaq = [
  {
    id: "witnessing",
    question: "見届け中の作品とは？",
    answer:
      "あなたがフィードバックした作品や、継続的に変化を追っている作品です。開発ログや更新内容を確認して、作品の成長を見届けましょう。",
  },
  {
    id: "saved",
    question: "保存作品とは？",
    answer:
      "気になった作品をあとで遊ぶためにストックできます。プレイ前のウィッシュリストとして使えます。",
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
