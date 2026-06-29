import type { PostgrestError } from "@supabase/supabase-js";
import { resolveErrorMessage } from "@/lib/error-message";

/** Newer project columns — stripped one-by-one when the DB schema lags behind the app. */
const OPTIONAL_PROJECT_COLUMNS = [
  "thumbnail_urls",
  "genres",
  "estimated_play_time",
  "overview_introduction",
  "overview_features",
  "x_url",
  "youtube_url",
  "playable_version",
  "release_status",
] as const;

export function getMissingProjectColumn(error: unknown): string | null {
  const message = resolveErrorMessage(error, "").toLowerCase();
  const looksLikeMissingColumn =
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("could not find");

  if (!looksLikeMissingColumn) {
    return null;
  }

  for (const column of OPTIONAL_PROJECT_COLUMNS) {
    if (message.includes(column)) {
      return column;
    }
  }

  return null;
}

export function omitProjectColumn<T extends Record<string, unknown>>(
  row: T,
  column: string,
): Record<string, unknown> {
  const next = { ...row };
  delete next[column];
  return next;
}

type WriteResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export async function writeProjectRowWithSchemaFallback<T extends Record<string, unknown>>(
  write: (row: Record<string, unknown>) => Promise<WriteResult<T>>,
  row: Record<string, unknown>,
): Promise<T> {
  let payload: Record<string, unknown> = { ...row };
  const stripped = new Set<string>();

  for (let attempt = 0; attempt <= OPTIONAL_PROJECT_COLUMNS.length; attempt++) {
    const { data, error } = await write(payload);

    if (!error && data) {
      return data;
    }

    if (!error) {
      break;
    }

    const missingColumn = getMissingProjectColumn(error);
    if (!missingColumn || stripped.has(missingColumn)) {
      throw error;
    }

    stripped.add(missingColumn);
    payload = omitProjectColumn(payload, missingColumn);
  }

  throw new Error("投稿に失敗しました。時間をおいて再度お試しください。");
}
