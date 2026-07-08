import type { DistributionType, PlayEnvironmentFormState } from "@/lib/play-environment";

export function getAccessUrlField(distribution: DistributionType) {
  switch (distribution) {
    case "browser":
      return {
        label: "ゲームプレイURL",
        placeholder: "https://...",
        hint: null,
      };
    case "download":
      return {
        label: "ダウンロードURL",
        placeholder: "https://...",
        hint: null,
      };
    case "external":
      return {
        label: "ストア・外部ページURL",
        placeholder: "https://...",
        hint: null,
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
