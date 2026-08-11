/**
 * Staging write E2E through the real Studio submit/edit boundaries:
 * validate → planStudioSubmitWrite → insertProject → updateProjectFromSubmitForm
 * → buildProjectEditFormDataFromGame reopen.
 *
 * ALLOWED write: this script only, Staging ref only, tagged private rows, deleted after.
 * Production hard-stop. No notification / email / message mutation.
 *
 * Usage: npx tsx scripts/staging-only/verify-five-category-create-edit-e2e.ts
 */
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertStagingOnly,
  loadPreviewE2EEnv,
  STAGING_REF,
  PRODUCTION_REF,
} from "./lib/preview-e2e-env";
import { validateSubmitDraftForPost } from "../../hooks/use-studio-submit";
import { planStudioSubmitWrite } from "../../lib/studio-submit-write-plan";
import { createEmptySubmitDraft } from "../../lib/studio-submit-draft";
import {
  createEmptySubmitPrototypeCategoryFields,
  type SubmitPrototypeCategory,
  type SubmitPrototypeCategoryFields,
} from "../../lib/prototype/studio-submit-flow";
import {
  prototypeCategoryToProjectCategory,
  type SubmitAssetCategoryFields,
} from "../../lib/studio-non-game-attributes";
import {
  insertProject,
  updateProjectDetailsInDb,
  projectRowToGame,
} from "../../lib/supabase/projects";
import { buildProjectEditFormDataFromGame } from "../../lib/project-edit-form-data";
import { PROJECT_CATEGORY_IDS, type ProjectCategoryId } from "../../lib/project-categories";
import type { ProjectRow } from "../../lib/supabase/schema";
import { EMPTY_PLAY_ENVIRONMENT_FORM } from "../../lib/play-environment";
import {
  decodeCategoryAttributesToAssetFields,
  decodeCategoryAttributesToPrototypeFields,
  encodeAssetFieldsToCategoryAttributes,
  encodePrototypeFieldsToCategoryAttributes,
  sanitizeAssetFieldsForSave,
  sanitizeNonGamePrototypeFieldsForSave,
} from "../../lib/studio-non-game-attributes";
import { buildAssetEditPersistPayload } from "../../lib/studio-asset-edit-persist";
import { buildNonGameEditPersistPayload } from "../../lib/studio-non-game-edit-persist";
import { buildGameGenresTagsEditPersistPayload } from "../../lib/studio-game-overview-edit-persist";
import type { ProjectEditFormData } from "../../lib/project-form";

const RUN_ID = `h8${Date.now().toString(36).slice(-6)}`;

function protoFields(category: SubmitPrototypeCategory): SubmitPrototypeCategoryFields {
  const base = createEmptySubmitPrototypeCategoryFields();
  if (category === "music") {
    return {
      ...base,
      kinds: ["楽曲"],
      musicGenres: ["ポップ"],
      musicDuration: "2:10",
      moods: ["明るい"],
      purposes: ["フィールド・探索"],
      publishDestinations: [
        { id: "a1", kind: "YouTube", url: "https://youtube.com/watch?v=hotfix", isPrimary: true },
      ],
    };
  }
  if (category === "dev_tool") {
    return {
      ...base,
      kinds: ["デスクトップツール"],
      toolUsageMethod: "ダウンロードして利用",
      toolEnvironments: ["Windows"],
      features: ["軽量"],
      publishDestinations: [
        { id: "t1", kind: "BOOTH", url: "https://booth.pm/hotfix", isPrimary: true },
      ],
    };
  }
  return {
    ...base,
    kinds: ["Webサービス"],
    serviceEnvironments: ["Web"],
    purposes: ["制作支援"],
    features: ["AI対応"],
    publishDestinations: [
      { id: "s1", kind: "自サイト", url: "https://example.com/hotfix-app", isPrimary: true },
    ],
  };
}

function baseDraft(title: string) {
  const draft = createEmptySubmitDraft();
  draft.title = title;
  draft.description = "hotfix e2e catchcopy";
  draft.phase = "playable";
  draft.introduction = "hotfix e2e intro";
  draft.visibility = "private";
  draft.publishDestinations = [
    {
      id: "pub-1",
      kind: "other",
      url: "https://example.com/hotfix-e2e",
      usageMethod: "other",
      isPrimary: true,
    },
  ];
  return draft;
}

function asAttrs(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function assertSubset(
  actual: unknown,
  expected: Record<string, unknown>,
  label: string,
) {
  const attrs = asAttrs(actual);
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(attrs[key], value, `${label}.${key}`);
  }
}

async function main() {
  const env = loadPreviewE2EEnv();
  assertStagingOnly(env);

  const url = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceKey) {
    throw new Error("SKIP-FAIL: SUPABASE_SERVICE_ROLE_KEY required for Staging create/edit E2E");
  }
  if (url.includes(PRODUCTION_REF)) {
    throw new Error("BLOCKED: Production Supabase URL");
  }
  if (!url.includes(STAGING_REF)) {
    throw new Error(`BLOCKED: not Staging ${STAGING_REF}`);
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SupabaseClient;

  const ownerLookup = await sb
    .from("projects")
    .select("owner_id, owner_name")
    .not("owner_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (ownerLookup.error || !ownerLookup.data?.owner_id) {
    throw new Error(
      `BLOCKED: could not find Staging owner (${ownerLookup.error?.message ?? "empty"})`,
    );
  }
  const owner = {
    ownerId: String(ownerLookup.data.owner_id),
    ownerName: String(ownerLookup.data.owner_name || "hotfix-e2e"),
    creator: String(ownerLookup.data.owner_name || "hotfix-e2e"),
  };
  const createdIds: string[] = [];

  async function cleanup() {
    if (createdIds.length === 0) return;
    const deleted = await sb.from("projects").delete().in("id", createdIds).select("id");
    if (deleted.error) {
      throw new Error(`cleanup failed: ${deleted.error.message}`);
    }
  }

  try {

    const cases: Array<{
      category: ProjectCategoryId;
      proto?: SubmitPrototypeCategory;
      assetFields?: SubmitAssetCategoryFields;
    }> = [
      { category: "game" },
      {
        category: "asset",
        assetFields: {
          kinds: ["キャラクター"],
          formats: ["2D"],
          tastes: ["アニメ・トゥーン"],
          tools: ["Unity"],
        },
      },
      { category: "audio", proto: "music" },
      { category: "dev-tool", proto: "dev_tool" },
      { category: "service-app", proto: "web_service" },
    ];

    for (const item of cases) {
      const title = `${RUN_ID} ${item.category}`;
      const draft = baseDraft(title);
      if (item.category === "game") {
        draft.genres = ["RPG"];
        draft.playAccessType = "free";
      } else {
        draft.genres = [];
      }

      const protoFieldsValue = item.proto ? protoFields(item.proto) : null;
      const validation = validateSubmitDraftForPost(draft, {
        projectCategory: item.category === "game" || item.assetFields ? item.category : undefined,
        prototypeCategory: item.proto,
        prototypeFields: protoFieldsValue ?? undefined,
        assetFields: item.assetFields,
      });
      assert.equal(validation.ok, true, `${item.category} validate`);

      const form = planStudioSubmitWrite({
        draft,
        owner,
        projectCategory: item.category === "game" || item.assetFields ? item.category : undefined,
        prototypeCategory: item.proto,
        prototypeFields: protoFieldsValue,
        assetFields: item.assetFields,
      });
      assert.equal(form.category, item.category, `${item.category} planner category`);
      if (item.category !== "game") {
        assert.ok(!form.estimatedPlayTime, `${item.category} no game play time`);
        assert.deepEqual(form.genres ?? [], [], `${item.category} no game genres`);
      }

      let expectedAttrs: Record<string, unknown> = {};
      if (item.assetFields) {
        const sanitized = sanitizeAssetFieldsForSave(item.assetFields);
        assert.equal(sanitized.ok, true, `${item.category} asset sanitize`);
        if (sanitized.ok) {
          expectedAttrs = encodeAssetFieldsToCategoryAttributes(sanitized.fields) as Record<
            string,
            unknown
          >;
        }
        assert.deepEqual(form.assetKinds, item.assetFields.kinds, `${item.category} planner kinds`);
      } else if (item.proto && protoFieldsValue) {
        const sanitized = sanitizeNonGamePrototypeFieldsForSave(item.proto, protoFieldsValue);
        assert.equal(sanitized.ok, true, `${item.category} proto sanitize`);
        if (sanitized.ok) {
          expectedAttrs = encodePrototypeFieldsToCategoryAttributes(
            sanitized.fields,
          ) as Record<string, unknown>;
        }
      }
      assertSubset(form.categoryAttributes, expectedAttrs, `${item.category} planner attrs`);

      const created = await insertProject(sb, form, owner);
      createdIds.push(created.id);
      assert.equal(created.category, item.category, `${item.category} insert category`);
      assertSubset(created.categoryAttributes, expectedAttrs, `${item.category} insert attrs`);
      if (item.assetFields) {
        assert.deepEqual(created.assetKinds, item.assetFields.kinds, `${item.category} insert kinds`);
      } else {
        assert.deepEqual(created.assetKinds ?? [], [], `${item.category} no asset kinds`);
      }

      const reopenAfterCreate = await sb
        .from("projects")
        .select("*")
        .eq("id", created.id)
        .single();
      if (reopenAfterCreate.error || !reopenAfterCreate.data) {
        throw new Error(`reopen create ${item.category}: ${reopenAfterCreate.error?.message}`);
      }
      const createdGame = projectRowToGame(reopenAfterCreate.data as ProjectRow);
      const createdForm = buildProjectEditFormDataFromGame(createdGame);
      assert.equal(createdForm.category, item.category, `${item.category} edit form category`);
      assertSubset(createdForm.categoryAttributes, expectedAttrs, `${item.category} edit form attrs`);
      if (item.assetFields) {
        assert.deepEqual(createdForm.assetKinds, item.assetFields.kinds);
      }

      const editedTitle = `${title} e`;
      let editPayload: ProjectEditFormData;
      let editedExpected = { ...expectedAttrs };
      if (item.category === "game") {
        editPayload = buildGameGenresTagsEditPersistPayload(createdGame, {
          genres: ["アクション"],
          featureTags: [],
          ageRating: createdForm.ageRating ?? "general",
        });
      } else if (item.assetFields) {
        const nextFields = {
          ...decodeCategoryAttributesToAssetFields(
            createdGame.categoryAttributes,
            createdGame.assetKinds,
          ),
          formats: ["2D", "3D"],
        };
        const built = buildAssetEditPersistPayload({
          game: createdGame,
          fields: nextFields,
        });
        assert.equal(built.ok, true, `${item.category} asset edit builder`);
        if (!built.ok) throw new Error(`${item.category} asset edit builder failed`);
        editPayload = built.payload;
        editedExpected = {
          ...editedExpected,
          ...encodeAssetFieldsToCategoryAttributes(nextFields),
        };
      } else if (item.proto) {
        const nextFields = decodeCategoryAttributesToPrototypeFields(
          createdGame.categoryAttributes,
        );
        if (item.proto === "music") {
          nextFields.moods = ["明るい", "穏やか"];
        } else if (item.proto === "dev_tool") {
          nextFields.features = ["軽量", "ローカル実行"];
        } else {
          nextFields.features = ["AI対応", "自動化"];
        }
        const built = buildNonGameEditPersistPayload({
          game: createdGame,
          prototypeCategory: item.proto,
          fields: nextFields,
          draft: {
            ...createEmptySubmitDraft(),
            visibility: "private",
            title: editedTitle,
          },
          playEnvironment: EMPTY_PLAY_ENVIRONMENT_FORM,
          editMode: "genres-tags",
        });
        assert.equal(built.ok, true, `${item.category} non-game edit builder`);
        if (!built.ok) throw new Error(`${item.category} non-game edit builder failed`);
        editPayload = built.payload;
        editedExpected = {
          ...editedExpected,
          ...asAttrs(encodePrototypeFieldsToCategoryAttributes(nextFields)),
        };
      } else {
        throw new Error(`missing edit builder for ${item.category}`);
      }

      editPayload = {
        ...editPayload,
        title: editedTitle,
        visibility: "private",
      };
      const updated = await updateProjectDetailsInDb(sb, created.id, editPayload);
      assert.equal(updated.category, item.category, `${item.category} persist after edit`);
      assert.equal(updated.title, editedTitle);
      assertSubset(updated.categoryAttributes, editedExpected, `${item.category} persist attrs`);
      if (item.category === "game") {
        assert.deepEqual(updated.genres, ["アクション"], `${item.category} persist genres`);
      }

      const reopen = await sb.from("projects").select("*").eq("id", created.id).single();
      if (reopen.error || !reopen.data) {
        throw new Error(`reopen edit ${item.category}: ${reopen.error?.message}`);
      }
      const reopened = projectRowToGame(reopen.data as ProjectRow);
      const reopenedForm = buildProjectEditFormDataFromGame(reopened);
      assert.equal(reopened.category, item.category, `${item.category} reopen category`);
      assert.equal(reopenedForm.category, item.category, `${item.category} reopen form category`);
      assertSubset(reopened.categoryAttributes, editedExpected, `${item.category} reopen attrs`);
      assertSubset(
        reopenedForm.categoryAttributes,
        editedExpected,
        `${item.category} reopen form attrs`,
      );
      if (item.proto) {
        assert.equal(
          prototypeCategoryToProjectCategory(item.proto),
          reopened.category,
        );
      }
      if (item.assetFields) {
        assert.deepEqual(reopened.assetKinds, item.assetFields.kinds);
        assert.deepEqual(reopenedForm.assetKinds, item.assetFields.kinds);
        assert.deepEqual(asAttrs(reopened.categoryAttributes).formats, ["2D", "3D"]);
        assert.deepEqual(asAttrs(reopened.categoryAttributes).tastes, item.assetFields.tastes);
        assert.deepEqual(asAttrs(reopened.categoryAttributes).tools, item.assetFields.tools);
      }
    }

    assert.equal(createdIds.length, PROJECT_CATEGORY_IDS.length);
    console.log(
      JSON.stringify(
        {
          ok: true,
          staging: STAGING_REF,
          created: createdIds.length,
          categories: [...PROJECT_CATEGORY_IDS],
          path: "validate+plan+insert+categoryEditBuilder+updateProjectDetailsInDb+reopen",
          runId: RUN_ID,
        },
        null,
        2,
      ),
    );
  } finally {
    await cleanup();
    if (createdIds.length > 0) {
      const leftover = await sb.from("projects").select("id").in("id", createdIds);
      assert.equal((leftover.data ?? []).length, 0, "e2e rows must be deleted");
    }
  }
}

void main();
