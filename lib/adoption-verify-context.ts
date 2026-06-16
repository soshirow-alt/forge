const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** ?adoption= クエリ — 無効 UUID は静かに無視 */
export function parseAdoptionQueryParam(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (!UUID_RE.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export type AdoptionVerifyContextRow = {
  id: string;
  projectId: string;
  playerQuote: string;
  updateSummary: string;
  publishedVersion: string;
};

export function toAdoptionVerifyContext(
  row: {
    id: string;
    projectId: string;
    playerQuote: string;
    updateSummary: string;
    publishedVersion: string;
  } | null,
  projectId: string,
): AdoptionVerifyContextRow | null {
  if (!row || row.projectId !== projectId) {
    return null;
  }

  return {
    id: row.id,
    projectId: row.projectId,
    playerQuote: row.playerQuote,
    updateSummary: row.updateSummary,
    publishedVersion: row.publishedVersion,
  };
}
