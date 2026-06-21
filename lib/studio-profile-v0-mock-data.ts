export type StudioProfileMilestone = {
  id: string;
  label: string;
  date: string;
};

export type StudioFollower = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
};

export const studioSelfProfile = {
  name: "しゃねこ",
  handle: "shaneco",
  avatar: "/images/landing/game-1.png",
  bio: "短編アドベンチャーと雰囲気作りが好きな個人開発者です。",
  genres: ["アドベンチャー", "ナラティブ", "RPG"],
  milestones: [
    { id: "m1", label: "初めての作品投稿", date: "2024/11/02" },
    { id: "m2", label: "フィードバック 100件到達", date: "2025/03/18" },
    { id: "m3", label: "初の正式版公開", date: "2025/05/20" },
  ] as StudioProfileMilestone[],
  activity: [
    { id: "a1", label: "「星の記憶」を投稿", date: "2025/01/10" },
    { id: "a2", label: "Devlog「序盤改善」を公開", date: "2025/06/12" },
    { id: "a3", label: "「夏の向こう側」を正式版公開", date: "2025/05/20" },
  ] as StudioProfileMilestone[],
  followers: [
    { id: "f1", name: "ゆき", handle: "yuki_plays", avatar: "/images/landing/game-2.png" },
    { id: "f2", name: "ハルカ", handle: "haruka_dev", avatar: "/images/landing/game-3.png" },
    { id: "f3", name: "レン", handle: "ren_voice", avatar: "/images/landing/game-4.png" },
  ] as StudioFollower[],
};
