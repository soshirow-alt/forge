/**
 * Incident 2026-07-09 — block OGP-related projects table writes from Preview/local
 * and while OG_SYNC_INCIDENT_PAUSED is true.
 */
import {
  OG_SYNC_INCIDENT_MESSAGE,
  OG_SYNC_INCIDENT_PAUSED,
} from "@/lib/og-sync-incident-pause";

export { OG_SYNC_INCIDENT_MESSAGE, OG_SYNC_INCIDENT_PAUSED };

/** @deprecated use OG_SYNC_INCIDENT_PAUSED */
export const OG_PIPELINE_PAUSED = OG_SYNC_INCIDENT_PAUSED;

/** @deprecated use OG_SYNC_INCIDENT_MESSAGE */
export const OG_PIPELINE_PAUSE_REASON = OG_SYNC_INCIDENT_MESSAGE;

export type OgProjectDbWriteField =
  | "thumbnail_url"
  | "thumbnail_urls"
  | "og_image_url";

const OG_PROJECT_DB_WRITE_FIELDS: OgProjectDbWriteField[] = [
  "thumbnail_url",
  "thumbnail_urls",
  "og_image_url",
];

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function shouldBlockOgProjectDbWrite(context: string): boolean {
  if (OG_SYNC_INCIDENT_PAUSED) {
    console.warn(
      `[og-incident-guard] blocked (${context}): ${OG_SYNC_INCIDENT_MESSAGE}`,
    );
    return true;
  }

  if (!isProductionDeployment()) {
    console.warn(
      `[og-incident-guard] blocked (${context}): VERCEL_ENV=${
        process.env.VERCEL_ENV ?? "unset"
      } — non-production must not write OGP fields to projects`,
    );
    return true;
  }

  return false;
}

/** Remove OGP-managed columns when writes are blocked; pass through otherwise. */
export function filterOgProjectDbWritePayload<T extends Record<string, unknown>>(
  payload: T,
  context: string,
): Partial<T> {
  if (!shouldBlockOgProjectDbWrite(context)) {
    return payload;
  }

  const filtered = { ...payload };
  for (const field of OG_PROJECT_DB_WRITE_FIELDS) {
    if (field in filtered) {
      delete filtered[field];
    }
  }
  return filtered;
}

/** OGP paths must never persist thumbnail columns (incident root cause). */
export function stripOgThumbnailFields<T extends Record<string, unknown>>(
  payload: T,
): Omit<T, "thumbnail_url" | "thumbnail_urls"> {
  const result = { ...payload };
  delete result.thumbnail_url;
  delete result.thumbnail_urls;
  return result;
}
