/**
 * Incident 2026-07-09: OGP sync may overwrite thumbnail_url/thumbnail_urls.
 * Pause all sync/prewarm until root cause is fixed and 047 is owner-approved.
 */
export const OG_SYNC_INCIDENT_PAUSED = true;

export const OG_SYNC_INCIDENT_MESSAGE = "incident: og sync paused";
