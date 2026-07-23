/**
 * Production OGP repair for the known corrupted 7 projects — DESIGN / DRY-RUN ONLY.
 *
 * Phase 3A: do NOT execute against Production. Default exit is always abort.
 *
 * Future execution unit (when explicitly approved):
 * - UUID explicit list only (never all-public sweep)
 * - touch only listed projects
 * - local backup of current Storage object
 * - fetch gallery thumbnail
 * - local sharp derive
 * - pre-upload validation
 * - exact ArrayBuffer upload
 * - post-upload verification
 * - confirm projects.og_image_url
 * - confirm other projects' OG SHA unchanged
 *
 * Usage (always aborts unless future GO + flags):
 *   npx tsx scripts/production-only/repair-corrupted-og-images.ts
 *   npx tsx scripts/production-only/repair-corrupted-og-images.ts --dry-run --project-id <uuid>
 */
import { createHash } from "node:crypto";

const PROD_REF = "bpnisgzxuwdxelhnduuf";

/** Known Production corrupted OG objects (Phase 2 audit). Do not expand casually. */
export const KNOWN_CORRUPTED_OG_PROJECT_IDS = [
  // REALIA, Unity Font Tool, プリズマティック・エッジ, キングゴブリン,
  // Time Battler, BUG BATTLER, Kick Counter — fill UUIDs only when repair GO lands.
] as const;

function extractRef(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/i)?.[1] ?? null;
  } catch {
    return null;
  }
}

function printPlan(): void {
  console.log(`
=== Production OGP repair (Phase 3A: design only) ===

Status: ABORTED by default Production guard.
This script must not upload, delete, or UPDATE Production data in Phase 3A.

Planned per-UUID steps (future GO only):
  1. Require --project-id <uuid> (repeatable); reject unknown IDs
  2. Refuse if NEXT_PUBLIC_SUPABASE_URL ref !== ${PROD_REF} when --execute
  3. Refuse --execute without explicit --i-understand-production-write
  4. Download current og object → local backup (sha256 recorded)
  5. Fetch gallery thumbnail_url (https binary)
  6. renderOgCoverJpeg locally
  7. assertValidOgJpegBytes (pre-upload)
  8. upload exact-length ArrayBuffer (upsert)
  9. download + assertFetchedOgJpegMatches
 10. UPDATE projects.og_image_url only after step 9
 11. Re-read non-target public projects' OG SHA — must be unchanged

Forbidden:
  - all-public / bulk without UUID list
  - Staging canary mixed into this script
  - skipping local backup
`);
}

function main(): void {
  const args = process.argv.slice(2);
  const wantsExecute = args.includes("--execute");
  const wantsDryRun = args.includes("--dry-run") || !wantsExecute;
  const understand = args.includes("--i-understand-production-write");
  const projectIds = args
    .map((a, i) => (a === "--project-id" ? args[i + 1] : null))
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  printPlan();

  const ref = extractRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(`env ref (if set): ${ref ?? "(none)"}`);
  console.log(`project-ids: ${projectIds.length ? projectIds.join(", ") : "(none)"}`);
  console.log(`mode: ${wantsExecute ? "execute-requested" : "dry-run"}`);

  // Hard stop for Phase 3A — even dry-run does not touch network writes.
  if (wantsExecute) {
    console.error(
      "ABORT: --execute is disabled until a later Phase with explicit Production repair GO.",
    );
    process.exit(2);
  }

  if (!understand && wantsExecute) {
    console.error("ABORT: missing --i-understand-production-write");
    process.exit(2);
  }

  if (ref === PROD_REF && wantsExecute) {
    console.error("ABORT: Production write path is sealed in Phase 3A");
    process.exit(2);
  }

  // Dry-run still refuses to perform any Storage/DB calls.
  console.log(
    "DRY-RUN / DESIGN ONLY: no Storage download/upload, no DB UPDATE. Exiting 0.",
  );
  if (projectIds.length === 0) {
    console.log("Tip: pass --project-id <uuid> when a future GO unlocks repair.");
  }

  // Keep a stable fingerprint helper available for future backup naming.
  const placeholder = createHash("sha256").update("phase3a-no-op").digest("hex").slice(0, 12);
  console.log(`noop fingerprint: ${placeholder}`);
  console.log(`dry-run flag honored: ${wantsDryRun}`);
  process.exit(0);
}

main();
