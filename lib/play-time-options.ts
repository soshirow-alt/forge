export const PLAY_TIME_OPTIONS = [
  "5分未満",
  "5〜15分",
  "15〜30分",
  "30分〜1時間",
  "1時間以上",
] as const;

export type PlayTimeOption = (typeof PLAY_TIME_OPTIONS)[number];
