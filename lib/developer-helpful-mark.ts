export type HelpfulMarkSourceType = "voice_response" | "project_feedback";

export function helpfulMarkKey(
  sourceType: HelpfulMarkSourceType,
  sourceId: string,
): string {
  return `${sourceType}:${sourceId}`;
}

export function parseHelpfulMarkKey(key: string): {
  sourceType: HelpfulMarkSourceType;
  sourceId: string;
} | null {
  const separator = key.indexOf(":");
  if (separator <= 0) {
    return null;
  }

  const sourceType = key.slice(0, separator);
  const sourceId = key.slice(separator + 1);

  if (
    (sourceType !== "voice_response" && sourceType !== "project_feedback") ||
    !sourceId
  ) {
    return null;
  }

  return { sourceType, sourceId };
}
