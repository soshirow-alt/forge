export type ScaleOption = {
  id: string;
  label: string;
};

export type FeedbackChoiceQuestion = {
  id: string;
  question: string;
  required: boolean;
  options: ScaleOption[];
  reasonPlaceholder: string;
  reasonMaxLength: number;
};

export type FeedbackTextQuestion = {
  id: string;
  question: string;
  required: boolean;
  placeholder: string;
  maxLength: number;
};

export const firstVoiceQuestion = {
  id: "q1-tutorial",
  question: "チュートリアルの長さはいかがでしたか？",
  preview: "チュートリアルが長すぎると感じるプレイヤーがいるかもしれません…",
  options: [
    { id: "too-long", label: "長すぎる" },
    { id: "slightly-long", label: "やや長い" },
    { id: "just-right", label: "ちょうどよい" },
    { id: "slightly-short", label: "やや短い" },
    { id: "too-short", label: "短すぎる" },
  ] as ScaleOption[],
};

export const feedbackChoiceQuestions: FeedbackChoiceQuestion[] = [
  {
    id: "q1-tutorial",
    question: "Q1. チュートリアルの長さはいかがでしたか？",
    required: true,
    options: firstVoiceQuestion.options,
    reasonPlaceholder: "理由があれば教えてください（任意）",
    reasonMaxLength: 500,
  },
  {
    id: "q2-battle",
    question: "Q2. バトル（遭遇イベント）の難易度バランスは？",
    required: true,
    options: [
      { id: "too-hard", label: "難しすぎる" },
      { id: "slightly-hard", label: "やや難しい" },
      { id: "just-right", label: "ちょうどよい" },
      { id: "slightly-easy", label: "やや易しい" },
      { id: "too-easy", label: "易しすぎる" },
    ],
    reasonPlaceholder: "理由があれば教えてください（任意）",
    reasonMaxLength: 500,
  },
];

export const feedbackTextQuestions: FeedbackTextQuestion[] = [
  {
    id: "q3-story",
    question: "Q3. ストーリーについて（任意）",
    required: false,
    placeholder: "没入感、キャラクター、展開など自由に",
    maxLength: 1000,
  },
  {
    id: "q4-other",
    question: "Q4. その他の意見（任意）",
    required: false,
    placeholder: "バグ報告や改善提案など",
    maxLength: 1000,
  },
];
