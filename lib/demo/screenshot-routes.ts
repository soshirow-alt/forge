export const SCREENSHOT_FLAGSHIP_GAME_ID = "seikat-no-tabiji";

export type ScreenshotGameTab = "overview" | "voices" | "devlog";

export const SCREENSHOT_SCENES = [
  {
    href: "/demo/screenshot/home",
    title: "プレイヤーホーム",
    description: "作品がたくさん集まっている発見画面",
  },
  {
    href: `/demo/screenshot/games/${SCREENSHOT_FLAGSHIP_GAME_ID}`,
    title: "作品詳細・概要",
    description: "育っている作品・プレイCTA・概要",
  },
  {
    href: `/demo/screenshot/games/${SCREENSHOT_FLAGSHIP_GAME_ID}?tab=voices`,
    title: "作品詳細・みんなの声",
    description: "プレイヤーの声が集まっている画面",
  },
  {
    href: `/demo/screenshot/games/${SCREENSHOT_FLAGSHIP_GAME_ID}?tab=devlog`,
    title: "作品詳細・開発ログ",
    description: "声を受けて改善が続いている画面",
  },
  {
    href: "/demo/screenshot/mypage/play-history",
    title: "マイページ・プレイ履歴",
    description: "見届け・関わり続けているプレイヤー像",
  },
  {
    href: "/demo/screenshot/studio",
    title: "Studio ホーム",
    description: "現行と同じ3グラフ・気になる動き・クイックアクセス",
  },
] as const;

export function screenshotGameHref(
  gameId: string = SCREENSHOT_FLAGSHIP_GAME_ID,
  tab: ScreenshotGameTab = "overview",
): string {
  const base = `/demo/screenshot/games/${encodeURIComponent(gameId)}`;
  return tab === "overview" ? base : `${base}?tab=${tab}`;
}
