/**
 * Future demo world — staging seed
 *
 * Usage:
 *   npm run seed:future-demo:staging
 *   npm run seed:future-demo:staging -- --fresh
 *   npm run hide:future-demo:staging
 *   npm run show:future-demo:staging
 *   npm run seed:future-demo:staging -- --execute
 *   npm run seed:future-demo:staging -- --fresh --execute
 *   npm run hide:future-demo:staging -- --execute
 *   npm run show:future-demo:staging -- --execute
 *   npm run patch:veteran-developer:staging -- --execute
 */
import { type SupabaseClient } from "@supabase/supabase-js";
import {
  DEV_NPC_DEFS,
  DEMO_NEW_USER_EMAIL,
  DEMO_NEW_USER_PASSWORD,
  DEMO_VETERAN_EMAIL,
  DEMO_VETERAN_PASSWORD,
  FUTURE_DEMO_MARKER,
  FUTURE_DEMO_TITLE_PREFIX,
  GENRES,
  PROJECT_TITLE_SUFFIXES,
  VETERAN_DEVELOPER_CREATOR,
  VETERAN_DEVELOPER_CREATOR_ID,
  VETERAN_DEVELOPER_NAME,
  VETERAN_OWNED_PROJECT_COUNT,
  VETERAN_PROJECT_SUFFIXES,
  WORLD_COUNTS,
  check014Applied,
  decodeWorldMeta,
  deleteFutureDemoProjectData,
  encodeWorldDescription,
  ensureAuthUser,
  ensureDeveloperProfile,
  ensureVersionPrompt,
  insertReleaseEvent,
  insertSession,
  insertVoice,
  insertWatch,
  listFutureDemoProjects,
  loadEnvLocal,
  loadWorldState,
  makePlayerNpcEmail,
  makePlayerNpcPassword,
  printLoginCredentials,
  projectTitle,
  saveWorldState,
  setFutureDemoVisibility,
  upsertPlay,
  worldBaseTime,
  worldTs,
  type FutureDemoWorldMeta,
} from "./future-demo-lib";
import {
  createScriptServiceClient,
  exitIfDryRun,
  logSupabaseTarget,
  parseScriptExecuteArgs,
} from "./lib/script-cli";

loadEnvLocal();

const { execute } = parseScriptExecuteArgs(process.argv);
const fresh = process.argv.includes("--fresh");
const hideWorld = process.argv.includes("--hide");
const showWorld = process.argv.includes("--show");
const patchVeteranVoices = process.argv.includes("--patch-veteran-voices");
const patchVeteranDeveloper = process.argv.includes("--patch-veteran-developer");

let supabase!: SupabaseClient;

function requireSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createScriptServiceClient("seed:future-demo:staging");
  }
  return supabase;
}

type SeededProject = {
  id: string;
  idText: string;
  ownerId: string;
  title: string;
  index: number;
};

async function seedVeteranOwnedDevlogs(
  project: SeededProject,
  base: Date,
  meta: FutureDemoWorldMeta,
) {
  const count = 5;

  for (let index = 0; index < count; index += 1) {
    const publishedVersion =
      index === count - 1 ? "0.2" : index > 0 ? "0.1" : null;

    const { error } = await supabase.from("project_devlogs").insert({
      project_id: project.idText,
      author_id: project.ownerId,
      title:
        index === 0
          ? "試作verを公開しました"
          : index === 1
            ? "ver 0.2 を公開しました"
            : `開発メモ #${index + 1}`,
      content: `${project.title} の更新です。${FUTURE_DEMO_MARKER} world=${meta.worldId}`,
      published_version: publishedVersion,
      created_at: worldTs(base, 8000 + project.index * 120 + index * 30),
    });

    if (error) {
      throw error;
    }
  }
}

async function resolvePlayerNpcIds(): Promise<string[]> {
  const state = loadWorldState();
  if (state?.playerNpcIds?.length) {
    return state.playerNpcIds;
  }

  const ids: string[] = [];
  for (let index = 1; index <= WORLD_COUNTS.playerNpcs; index += 1) {
    const id = await ensureAuthUser(
      supabase,
      makePlayerNpcEmail(index),
      makePlayerNpcPassword(index),
    );
    ids.push(id);
  }

  return ids;
}

async function countVeteranOwnedProjects(veteranId: string): Promise<number> {
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", veteranId)
    .like("title", `${FUTURE_DEMO_TITLE_PREFIX}%`);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function patchVeteranDeveloperProjects() {
  console.log("=== Patch Demo Veteran developer projects (additive) ===");

  const applied = await check014Applied(supabase);
  if (!applied) {
    console.error("Apply migration 014 before patching veteran developer data.");
    process.exit(2);
  }

  const existingWorld = await listFutureDemoProjects(supabase);
  if (existingWorld.length < WORLD_COUNTS.projects) {
    console.error("Run seed:future-demo:staging first (base world missing).");
    process.exit(1);
  }

  const veteranId = await ensureAuthUser(supabase, DEMO_VETERAN_EMAIL, DEMO_VETERAN_PASSWORD);
  const ownedCount = await countVeteranOwnedProjects(veteranId);

  if (ownedCount >= VETERAN_OWNED_PROJECT_COUNT) {
    console.log(`PASS — veteran already owns ${ownedCount} future-demo project(s).`);
    printLoginCredentials();
    return;
  }

  await ensureDeveloperProfile(
    supabase,
    veteranId,
    VETERAN_DEVELOPER_CREATOR_ID,
    VETERAN_DEVELOPER_NAME,
  );

  const playerNpcIds = await resolvePlayerNpcIds();
  const base = worldBaseTime();
  const state = loadWorldState();
  const meta: FutureDemoWorldMeta = state ?? {
    worldId: `world-patch-${Date.now()}`,
    veteranId,
    newUserId: "",
    devNpcIds: [],
    playerNpcIds,
    projectIds: existingWorld.map((project) => project.id as string),
    releasedProjectIds: [],
    reopenedProjectIds: [],
    veteranOwnedProjectIds: [],
    seededAt: new Date().toISOString(),
    visibility: "public",
  };

  meta.veteranId = veteranId;
  meta.playerNpcIds = playerNpcIds;
  meta.veteranOwnedProjectIds = meta.veteranOwnedProjectIds ?? [];

  const projects: SeededProject[] = [];

  console.log(`\n--- Insert ${VETERAN_OWNED_PROJECT_COUNT} veteran-owned projects ---`);

  for (let index = 0; index < VETERAN_OWNED_PROJECT_COUNT; index += 1) {
    const suffix = VETERAN_PROJECT_SUFFIXES[index]!;
    const title = projectTitle(suffix);
    const blurb = `${suffix} — Demo Veteran が育てた作品です。`;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: veteranId,
        owner_name: VETERAN_DEVELOPER_NAME,
        title,
        creator: VETERAN_DEVELOPER_CREATOR,
        genre: GENRES[index % GENRES.length],
        genres: [GENRES[index % GENRES.length]!],
        description: `${blurb}\n\n${FUTURE_DEMO_MARKER}\n${JSON.stringify({ ...meta, veteranOwned: true })}`,
        phase: index < 3 ? "試作ver" : "プレイ可能ver",
        status: "プレイ可能ver",
        looking_for_testers: index === 0,
        tester_slots: index === 0 ? 8 : null,
        section: index < 2 ? "new" : index < 5 ? "beta" : "testers",
        play_url: `https://example.com/future-demo/veteran/${index + 1}`,
        visibility: meta.visibility ?? "public",
        playable_version: index % 2 === 0 ? "0.2" : "0.1",
        release_status: "in_development",
        created_at: worldTs(base, 7000 + index * 60),
      })
      .select("id, title")
      .single();

    if (error || !data) {
      throw error ?? new Error("veteran project insert failed");
    }

    const project: SeededProject = {
      id: data.id as string,
      idText: data.id as string,
      ownerId: veteranId,
      title: data.title as string,
      index: 100 + index,
    };

    projects.push(project);
    meta.veteranOwnedProjectIds!.push(project.id);
    meta.projectIds.push(project.id);
  }

  console.log("\n--- Devlogs ---");
  for (const project of projects) {
    await seedVeteranOwnedDevlogs(project, base, meta);
  }

  console.log("\n--- NPC engagement (no veteran self-play) ---");
  for (const project of projects) {
    const v01 = await ensureVersionPrompt(supabase, project.idText, "0.1");
    const v02 = await ensureVersionPrompt(supabase, project.idText, "0.2");
    await seedNpcEngagement(playerNpcIds, project, base, v01, v02);
  }

  const releasedCount = 5;
  const releasedProjects = projects.slice(0, releasedCount);
  const reopenIndex = 2;

  console.log("\n--- Release events ---");
  for (const project of releasedProjects) {
    const releaseAt = worldTs(base, 9000 + project.index * 30);
    await insertReleaseEvent(
      supabase,
      project.id,
      veteranId,
      "released",
      `${project.title} を正式verとして公開しました。`,
      releaseAt,
    );
    meta.releasedProjectIds.push(project.id);
  }

  const reopenedProject = releasedProjects[reopenIndex]!;
  await insertReleaseEvent(
    supabase,
    reopenedProject.id,
    veteranId,
    "release_reopened",
    `${reopenedProject.title} を再調整中に戻しました。`,
    worldTs(base, 9600 + reopenIndex * 20),
  );
  meta.reopenedProjectIds.push(reopenedProject.id);

  saveWorldState(meta);

  console.log("\nPASS — veteran developer patch complete");
  console.log(`veteran-owned projects: ${projects.length}`);
  console.log(`released: ${releasedProjects.length}`);
  console.log(`reopened: 1`);
  printLoginCredentials();
  console.log("\nNext: npm run verify:future-demo:staging");
}

async function seedDevlogs(project: SeededProject, base: Date, meta: FutureDemoWorldMeta) {
  const count = project.index < 12 ? 4 : project.index < 20 ? 3 : 2;
  const rows = [];

  for (let index = 0; index < count; index += 1) {
    const publishedVersion =
      index === count - 1 && project.index % 2 === 0 ? "0.2" : index > 0 ? "0.1" : null;

    rows.push({
      project_id: project.idText,
      author_id: project.ownerId,
      title:
        index === 0
          ? "試作verを公開しました"
          : index === 1
            ? "プレイヤーの声を反映しました"
            : `開発メモ #${index + 1}`,
      content: `${project.title} の更新です。${FUTURE_DEMO_MARKER} world=${meta.worldId}`,
      published_version: publishedVersion,
      created_at: worldTs(base, project.index * 120 + index * 30),
    });
  }

  const { error } = await supabase.from("project_devlogs").insert(rows);
  if (error) {
    throw error;
  }
}

async function seedVeteranEngagement(
  veteranId: string,
  project: SeededProject,
  base: Date,
  prompt01: string,
  prompt02: string,
  mode: "multi_version" | "voice" | "watch" | "play_only",
) {
  const t0 = project.index * 200 + 20;

  await upsertPlay(supabase, veteranId, project.idText, worldTs(base, t0));
  await insertSession(supabase, {
    userId: veteranId,
    projectIdText: project.idText,
    versionKey: "0.1",
    playedAt: worldTs(base, t0 + 5),
  });

  if (mode === "multi_version") {
    await insertSession(supabase, {
      userId: veteranId,
      projectIdText: project.idText,
      versionKey: "0.2",
      playedAt: worldTs(base, t0 + 15),
    });
    await insertVoice(supabase, {
      userId: veteranId,
      projectIdText: project.idText,
      versionKey: "0.1",
      promptId: prompt01,
      createdAt: worldTs(base, t0 + 11),
    });
  }

  if (mode === "voice") {
    await insertVoice(supabase, {
      userId: veteranId,
      projectIdText: project.idText,
      versionKey: "0.1",
      promptId: prompt01,
      createdAt: worldTs(base, t0 + 10),
    });
    await insertVoice(supabase, {
      userId: veteranId,
      projectIdText: project.idText,
      versionKey: "0.2",
      promptId: prompt02,
      createdAt: worldTs(base, t0 + 16),
    });
  }

  if (mode === "watch") {
    await insertWatch(supabase, veteranId, project.idText, worldTs(base, t0 - 5));
    await insertSession(supabase, {
      userId: veteranId,
      projectIdText: project.idText,
      versionKey: "0.1",
      playedAt: worldTs(base, t0 + 12),
    });
  }

  if (mode === "play_only") {
    await insertSession(supabase, {
      userId: veteranId,
      projectIdText: project.idText,
      versionKey: "0.1",
      playedAt: worldTs(base, t0 + 18),
    });
    await insertVoice(supabase, {
      userId: veteranId,
      projectIdText: project.idText,
      versionKey: "0.1",
      promptId: prompt01,
      createdAt: worldTs(base, t0 + 22),
    });
    if (project.index % 2 === 0) {
      await insertVoice(supabase, {
        userId: veteranId,
        projectIdText: project.idText,
        versionKey: "0.2",
        promptId: prompt02,
        createdAt: worldTs(base, t0 + 24),
      });
    }
  }
}

async function seedNpcEngagement(
  playerNpcIds: string[],
  project: SeededProject,
  base: Date,
  prompt01: string,
  prompt02: string,
) {
  const npcCount = 3 + (project.index % 2);

  for (let index = 0; index < npcCount; index += 1) {
    const npcId = playerNpcIds[(project.index + index) % playerNpcIds.length]!;
    const t = project.index * 200 + 40 + index * 8;

    await upsertPlay(supabase, npcId, project.idText, worldTs(base, t));
    await insertSession(supabase, {
      userId: npcId,
      projectIdText: project.idText,
      versionKey: "0.1",
      playedAt: worldTs(base, t + 2),
    });

    await insertVoice(supabase, {
      userId: npcId,
      projectIdText: project.idText,
      versionKey: "0.1",
      promptId: prompt01,
      createdAt: worldTs(base, t + 4),
    });

    if (index % 2 === 1) {
      await insertVoice(supabase, {
        userId: npcId,
        projectIdText: project.idText,
        versionKey: "0.2",
        promptId: prompt02,
        createdAt: worldTs(base, t + 5),
      });
    }

    if (project.index < WORLD_COUNTS.released) {
      if (index === 0) {
        await insertSession(supabase, {
          userId: npcId,
          projectIdText: project.idText,
          versionKey: "0.2",
          playedAt: worldTs(base, t + 6),
        });
      } else if (index === 1) {
        await insertWatch(supabase, npcId, project.idText, worldTs(base, t - 2));
        await insertSession(supabase, {
          userId: npcId,
          projectIdText: project.idText,
          versionKey: "0.1",
          playedAt: worldTs(base, t + 8),
        });
      }
    }
  }
}

function veteranModeForReleasedIndex(index: number): "multi_version" | "voice" | "watch" {
  if (index < 5) {
    return "multi_version";
  }
  if (index < 9) {
    return "voice";
  }
  return "watch";
}

async function runHide() {
  const count = await setFutureDemoVisibility(supabase, "private");
  console.log(`PASS — hid ${count} future-demo project(s) (元の世界戦)`);
  console.log("Restore demo world: npm run show:future-demo:staging");
}

async function runShow() {
  const count = await setFutureDemoVisibility(supabase, "public");
  console.log(`PASS — showed ${count} future-demo project(s) (デモ世界戦)`);
}

async function augmentVeteranVoices() {
  console.log("=== Patch veteran voices (existing world) ===");
  const veteranId = await ensureAuthUser(supabase, DEMO_VETERAN_EMAIL, DEMO_VETERAN_PASSWORD);
  const projects = await listFutureDemoProjects(supabase);
  const base = worldBaseTime();
  let added = 0;

  for (const row of projects) {
    const projectIdText = row.id as string;
    const v01 = await ensureVersionPrompt(supabase, projectIdText, "0.1");
    const v02 = await ensureVersionPrompt(supabase, projectIdText, "0.2");

    const { data: existing } = await supabase
      .from("project_voice_responses")
      .select("prompt_id")
      .eq("user_id", veteranId)
      .eq("project_id", projectIdText);

    const promptIds = new Set((existing ?? []).map((item) => item.prompt_id as string));

    if (!promptIds.has(v01)) {
      await insertVoice(supabase, {
        userId: veteranId,
        projectIdText,
        versionKey: "0.1",
        promptId: v01,
        createdAt: worldTs(base, 5000 + added),
      });
      added += 1;
    }

    if (!promptIds.has(v02) && (projects.indexOf(row) % 2 === 0)) {
      await insertVoice(supabase, {
        userId: veteranId,
        projectIdText,
        versionKey: "0.2",
        promptId: v02,
        createdAt: worldTs(base, 5100 + added),
      });
      added += 1;
    }
  }

  console.log(`PASS — added ${added} veteran voice(s)`);
}

async function runSeed() {
  console.log("=== Future demo world seed (staging) ===");
  console.log(
    "Supabase:",
    process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "missing",
  );

  const applied = await check014Applied(supabase);
  if (!applied) {
    console.error("Apply migration 014 before seeding future demo world.");
    process.exit(2);
  }

  const existing = await listFutureDemoProjects(supabase);

  if (existing.length >= WORLD_COUNTS.projects && !fresh) {
    console.log(`World already seeded (${existing.length} projects).`);
    printLoginCredentials();
    console.log("\nRe-seed blocked — use --fresh only before grants exist.");
    process.exit(0);
  }

  if (fresh && existing.length > 0) {
    console.log("--fresh: removing pre-grant demo projects…");
    for (const project of existing) {
      const deleted = await deleteFutureDemoProjectData(
        supabase,
        project.id as string,
        project.id as string,
      );
      if (!deleted) {
        console.error(
          "Cannot --fresh: grants exist (append-only). Use hide/show to toggle worlds.",
        );
        process.exit(3);
      }
    }
  }

  const base = worldBaseTime();
  const worldId = `world-${Date.now()}`;

  console.log("\n--- S1: auth users (20) ---");
  const veteranId = await ensureAuthUser(supabase, DEMO_VETERAN_EMAIL, DEMO_VETERAN_PASSWORD);
  const newUserId = await ensureAuthUser(supabase, DEMO_NEW_USER_EMAIL, DEMO_NEW_USER_PASSWORD);

  const devNpcIds: string[] = [];
  for (const dev of DEV_NPC_DEFS) {
    const id = await ensureAuthUser(supabase, dev.email, dev.password);
    await ensureDeveloperProfile(
      supabase,
      id,
      `future-demo-${dev.key}`,
      dev.publicName,
    );
    devNpcIds.push(id);
  }

  const playerNpcIds: string[] = [];
  for (let index = 1; index <= WORLD_COUNTS.playerNpcs; index += 1) {
    const id = await ensureAuthUser(
      supabase,
      makePlayerNpcEmail(index),
      makePlayerNpcPassword(index),
    );
    playerNpcIds.push(id);
  }

  console.log("Veteran:", veteranId.slice(0, 8) + "…");
  console.log("New user:", newUserId.slice(0, 8) + "…");

  console.log("\n--- S2: projects (25) ---");
  const projects: SeededProject[] = [];
  let titleIndex = 0;
  let devIndex = 0;
  let devProjectSlot = 0;

  const metaDraft: FutureDemoWorldMeta = {
    worldId,
    veteranId,
    newUserId,
    devNpcIds,
    playerNpcIds,
    projectIds: [],
    releasedProjectIds: [],
    reopenedProjectIds: [],
    seededAt: new Date().toISOString(),
    visibility: "public",
  };

  for (let projectIndex = 0; projectIndex < WORLD_COUNTS.projects; projectIndex += 1) {
    while (devProjectSlot >= DEV_NPC_DEFS[devIndex]!.projectCount) {
      devIndex += 1;
      devProjectSlot = 0;
    }

    const dev = DEV_NPC_DEFS[devIndex]!;
    const ownerId = devNpcIds[devIndex]!;
    const suffix = PROJECT_TITLE_SUFFIXES[titleIndex]!;
    titleIndex += 1;
    devProjectSlot += 1;

    const title = projectTitle(suffix);
    const blurb = `${suffix} — Forge 将来像デモ世界の作品です。`;
    const description =
      projectIndex === 0 ? encodeWorldDescription(metaDraft, blurb) : blurb;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: ownerId,
        owner_name: dev.publicName,
        title,
        creator: dev.creator,
        genre: GENRES[projectIndex % GENRES.length],
        genres: [GENRES[projectIndex % GENRES.length]!],
        description,
        phase: projectIndex < 8 ? "試作ver" : "プレイ可能ver",
        status: projectIndex % 4 === 0 ? "テスター募集中" : "プレイ可能ver",
        looking_for_testers: projectIndex % 4 === 0,
        tester_slots: projectIndex % 4 === 0 ? 10 : null,
        section: projectIndex < 6 ? "new" : projectIndex < 14 ? "beta" : "testers",
        play_url: `https://example.com/future-demo/${projectIndex + 1}`,
        visibility: "public",
        playable_version: projectIndex % 3 === 0 ? "0.2" : "0.1",
        release_status: "in_development",
        created_at: worldTs(base, projectIndex * 60),
      })
      .select("id, title")
      .single();

    if (error || !data) {
      throw error ?? new Error("project insert failed");
    }

    const id = data.id as string;
    projects.push({
      id,
      idText: id,
      ownerId,
      title: data.title as string,
      index: projectIndex,
    });
    metaDraft.projectIds.push(id);
  }

  console.log("\n--- S3: devlogs ---");
  for (const project of projects) {
    await seedDevlogs(project, base, metaDraft);
  }

  console.log("\n--- S4–S5: engagement ---");
  const prompts = new Map<string, { v01: string; v02: string }>();

  for (const project of projects) {
    const v01 = await ensureVersionPrompt(supabase, project.idText, "0.1");
    const v02 = await ensureVersionPrompt(supabase, project.idText, "0.2");
    prompts.set(project.idText, { v01, v02 });

    await seedNpcEngagement(playerNpcIds, project, base, v01, v02);

    const releasedIndex = project.index;
    if (releasedIndex < WORLD_COUNTS.released) {
      const mode = veteranModeForReleasedIndex(releasedIndex);
      await seedVeteranEngagement(veteranId, project, base, v01, v02, mode);
    } else {
      await seedVeteranEngagement(veteranId, project, base, v01, v02, "play_only");
    }
  }

  console.log("\n--- S6: release events (12) ---");
  const releasedProjects = projects.slice(0, WORLD_COUNTS.released);
  const reopenedIndices = [2, 6, 10];

  for (const project of releasedProjects) {
    const releaseAt = worldTs(base, 3000 + project.index * 30);
    await insertReleaseEvent(
      supabase,
      project.id,
      project.ownerId,
      "released",
      `${project.title} を正式verとして公開しました。`,
      releaseAt,
    );
    metaDraft.releasedProjectIds.push(project.id);
  }

  console.log("\n--- S7: reopen (3) ---");
  for (const index of reopenedIndices) {
    const project = releasedProjects[index]!;
    await insertReleaseEvent(
      supabase,
      project.id,
      project.ownerId,
      "release_reopened",
      `${project.title} を再調整中に戻しました。`,
      worldTs(base, 3600 + index * 20),
    );
    metaDraft.reopenedProjectIds.push(project.id);
  }

  const flagship = projects[0]!;
  const { error: metaUpdateError } = await supabase
    .from("projects")
    .update({
      description: encodeWorldDescription(
        metaDraft,
        `${flagship.title} — Forge 将来像デモ世界の registry 作品です。`,
      ),
    })
    .eq("id", flagship.id);

  if (metaUpdateError) {
    throw metaUpdateError;
  }

  saveWorldState(metaDraft);

  console.log("\nPASS — future demo world seeded");
  console.log(`worldId: ${worldId}`);
  console.log(`projects: ${projects.length}`);
  console.log(`released: ${metaDraft.releasedProjectIds.length}`);
  console.log(`reopened: ${metaDraft.reopenedProjectIds.length}`);
  printLoginCredentials();
  console.log("\nNext: npm run verify:future-demo:staging");
}

async function main() {
  exitIfDryRun("seed:future-demo:staging", execute);
  logSupabaseTarget("seed:future-demo:staging");
  supabase = createScriptServiceClient("seed:future-demo:staging");

  if (hideWorld) {
    await runHide();
    return;
  }

  if (showWorld) {
    await runShow();
    return;
  }

  if (patchVeteranVoices) {
    await augmentVeteranVoices();
    return;
  }

  if (patchVeteranDeveloper) {
    await patchVeteranDeveloperProjects();
    return;
  }

  await runSeed();
}

main().catch((error) => {
  console.error("FAIL:", error);
  process.exit(1);
});
