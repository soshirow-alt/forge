import type { DistributionType, PlayEnvironmentFormState } from "@/lib/play-environment";

export function getAccessUrlField(distribution: DistributionType) {
  switch (distribution) {
    case "browser":
      return {
        label: "プレイURL",
        placeholder: "https://example.com/play",
        hint: "テスターがブラウザで開いて遊べるURL",
      };
    case "download":
      return {
        label: "ダウンロードURL",
        placeholder: "https://example.com/game.zip",
        hint: "zip など配布ファイルのURL",
      };
    case "external":
      return {
        label: "ゲームページURL",
        placeholder: "https://store.steampowered.com/...",
        hint: "Steam・itch.io 等、テスターがゲームにアクセスするURL",
      };
    default:
      return null;
  }
}

export function validatePlayAccess(
  playEnvironment: PlayEnvironmentFormState,
  playUrl: string,
): string | null {
  if (!playEnvironment.distribution) {
    return "配布形式を選んでください。";
  }
  if (!playUrl.trim()) {
    return `${getAccessUrlField(playEnvironment.distribution)?.label ?? "URL"}を入力してください。`;
  }
  return null;
}
