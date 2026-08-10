/**
 * Staging-only: ensure an empty-inbox Auth user for Owner eyeball of the
 * UI-only Lumen Audio sample thread (real conversations = 0).
 *
 * Does not touch forge.operation / actor fixture threads.
 * Password reuses FORGE_PREVIEW_E2E_PASSWORD (no Owner manual registration).
 */

import {
  assertStagingOnly,
  loadPreviewE2EEnv,
  requireEnv,
} from "./lib/preview-e2e-env";
import {
  authedClient,
  ensureAuthUser,
  ensureDeveloperProfile,
  signInPassword,
} from "./lib/ensure-preview-e2e-users";

const MARKER = "forge-msg-empty-viewer-v1";
const DEFAULT_EMPTY_EMAIL = "forge.messages.empty.staging@example.invalid";

async function main() {
  const env = loadPreviewE2EEnv();
  assertStagingOnly(env);

  const email = (
    env.FORGE_PREVIEW_E2E_EMPTY_EMAIL || DEFAULT_EMPTY_EMAIL
  )
    .trim()
    .toLowerCase();
  const password = requireEnv(env, "FORGE_PREVIEW_E2E_PASSWORD");

  const user = await ensureAuthUser({
    env,
    email,
    password,
    displayName: "Forge Messages Empty",
    marker: MARKER,
  });
  await ensureDeveloperProfile({
    env,
    userId: user.userId,
    publicName: "Forge Messages Empty",
    profile: "Staging empty inbox for message sample eyeball",
    activityTags: ["game_creator"],
    marker: MARKER,
  });

  const session = await signInPassword({ env, email, password });
  const db = authedClient(env, session.accessToken);
  const { data, error } = await db.rpc("list_my_collab_consultations");
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  if (rows.length > 0) {
    throw new Error(
      `empty viewer must have 0 consultations, got ${rows.length}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        userId: user.userId,
        created: user.created,
        consultations: 0,
        passwordSource: "FORGE_PREVIEW_E2E_PASSWORD",
        purpose: "Preview /messages sample (real=0)",
        leaveOperationFixture: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
