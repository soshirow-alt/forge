import type { DistributionType, PlayEnvironmentFormState } from "@/lib/play-environment";
import {
  validatePublishDestinations,
  type PublishDestination,
} from "@/lib/project-publish-links";

export function getAccessUrlField(distribution: DistributionType) {
  switch (distribution) {
    case "browser":
      return {
        label: "公開先URL（ブラウザ）",
        placeholder: "https://...",
        hint: null,
      };
    case "download":
      return {
        label: "公開先URL（ダウンロード）",
        placeholder: "https://...",
        hint: null,
      };
    case "external":
      return {
        label: "公開先URL",
        placeholder: "https://...",
        hint: null,
      };
    default:
      return null;
  }
}

/** @deprecated Prefer validatePublishAccess / validatePublishDestinations */
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

/** 公開先（メイン URL 必須）のバリデーション */
export function validatePublishAccess(
  destinations: PublishDestination[],
): string | null {
  return validatePublishDestinations(destinations);
}
