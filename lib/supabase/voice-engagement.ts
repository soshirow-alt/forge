import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePlayableVersion } from "@/lib/playable-version";
import type { ProjectVoiceNurtureSignal } from "@/lib/project-voice-nurture";
import { emptyVoiceNurtureSignal } from "@/lib/project-voice-nurture";
import type { VoiceAnswerDraft } from "@/lib/version-prompt-types";
import type { DeveloperPromptInput } from "@/lib/version-prompt-form";
import {
  DEFAULT_REPLAY_PROMPT_TEXT,
  REPLAY_INTENT_OPTIONS,
  type VersionPrompt,
  type VersionPromptOption,
  type VersionPromptResponseKind,
  type VersionPromptSource,
  type VoiceResponse,
  MAX_PROMPTS_PER_VERSION,
} from "@/lib/version-prompt-types";
import type { PublicVoiceAggregateRow } from "@/lib/voice-aggregates";
import {
  buildVoiceAggregateRows,
  fetchResponseCountsByPromptId,
  promptContentChanged,
  type PromptAggregateSource,
} from "@/lib/supabase/voice-prompt-immutable";

type PromptRow = {
  id: string;
  project_id: string;
  version_key: string;
  prompt_text: string;
  response_kind: VersionPromptResponseKind;
  options: VersionPromptOption[] | null;
  sort_order: number;
  source: VersionPromptSource;
  created_at: string;
  archived_at: string | null;
};

type ResponseRow = {
  id: string;
  user_id: string;
  project_id: string;
  version_key: string;
  prompt_id: string;
  answer_value: string;
  answer_label: string | null;
  created_at: string;
  updated_at: string;
};

function promptRowToItem(row: PromptRow): VersionPrompt {
  return {
    id: row.id,
    projectId: row.project_id,
    versionKey: row.version_key,
    promptText: row.prompt_text,
    responseKind: row.response_kind,
    options: row.options ?? undefined,
    sortOrder: row.sort_order,
    source: row.source,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
  };
}

function responseRowToItem(row: ResponseRow): VoiceResponse {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    versionKey: row.version_key,
    promptId: row.prompt_id,
    answerValue: row.answer_value,
    answerLabel: row.answer_label ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchVersionPrompts(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
): Promise<VersionPrompt[]> {
  const version = resolvePlayableVersion(versionKey);
  const { data, error } = await supabase
    .from("project_version_prompts")
    .select("*")
    .eq("project_id", projectId)
    .eq("version_key", version)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  const prompts = ((data ?? []) as PromptRow[]).map(promptRowToItem);
  const developerPrompts = prompts.filter((p) => p.source === "developer");

  if (developerPrompts.length === 0) {
    return [await ensurePlatformDefaultPrompt(supabase, projectId, version)];
  }

  return developerPrompts;
}

export async function fetchDeveloperVersionPrompts(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
): Promise<VersionPrompt[]> {
  const version = resolvePlayableVersion(versionKey);
  const { data, error } = await supabase
    .from("project_version_prompts")
    .select("*")
    .eq("project_id", projectId)
    .eq("version_key", version)
    .eq("source", "developer")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as PromptRow[]).map(promptRowToItem);
}

export async function saveDeveloperVersionPrompts(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  prompts: DeveloperPromptInput[],
): Promise<VersionPrompt[]> {
  const version = resolvePlayableVersion(versionKey);
  if (prompts.length > MAX_PROMPTS_PER_VERSION) {
    throw new Error(
      `問いは最大${MAX_PROMPTS_PER_VERSION}問までです。余分な問いを削除してから保存してください`,
    );
  }
  const normalized = prompts;
  const now = new Date().toISOString();

  const { data: existingRows, error: existingError } = await supabase
    .from("project_version_prompts")
    .select("*")
    .eq("project_id", projectId)
    .eq("version_key", version)
    .eq("source", "developer")
    .is("archived_at", null);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingById = new Map(
    ((existingRows ?? []) as PromptRow[]).map((row) => [row.id, row]),
  );
  const existingIds = [...existingById.keys()];

  const responseCounts = await fetchResponseCountsByPromptId(
    supabase,
    projectId,
    version,
    existingIds.length > 0 ? existingIds : undefined,
  );

  const keepIds = new Set(
    normalized.map((prompt) => prompt.id).filter(Boolean) as string[],
  );

  if (normalized.length > 0) {
    const { error: archiveDefaultError } = await supabase
      .from("project_version_prompts")
      .update({ archived_at: now })
      .eq("project_id", projectId)
      .eq("version_key", version)
      .eq("source", "platform_default")
      .is("archived_at", null);

    if (archiveDefaultError) {
      throw new Error(archiveDefaultError.message);
    }
  }

  for (const id of existingIds) {
    if (!keepIds.has(id)) {
      const { error: archiveError } = await supabase
        .from("project_version_prompts")
        .update({ archived_at: now })
        .eq("id", id);

      if (archiveError) {
        throw new Error(archiveError.message);
      }
    }
  }

  const saved: VersionPrompt[] = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const prompt = normalized[index]!;
    const rowPayload = {
      project_id: projectId,
      version_key: version,
      prompt_text: prompt.promptText.trim(),
      response_kind: prompt.responseKind,
      options: prompt.options ?? null,
      sort_order: index,
      source: "developer" as const,
      archived_at: null,
    };

    if (!prompt.id) {
      const { data, error } = await supabase
        .from("project_version_prompts")
        .insert(rowPayload)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        saved.push(promptRowToItem(data as PromptRow));
      }
      continue;
    }

    const existing = existingById.get(prompt.id);
    if (!existing) {
      const { data, error } = await supabase
        .from("project_version_prompts")
        .insert(rowPayload)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        saved.push(promptRowToItem(data as PromptRow));
      }
      continue;
    }

    const existingSource: PromptAggregateSource = {
      id: existing.id,
      prompt_text: existing.prompt_text,
      response_kind: existing.response_kind,
      options: existing.options,
      sort_order: existing.sort_order,
      source: existing.source,
      archived_at: existing.archived_at,
      created_at: existing.created_at,
    };

    const hasResponses = (responseCounts.get(prompt.id) ?? 0) > 0;
    const contentChanged = promptContentChanged(existingSource, prompt);

    if (contentChanged && hasResponses) {
      const { error: archiveError } = await supabase
        .from("project_version_prompts")
        .update({ archived_at: now })
        .eq("id", prompt.id);

      if (archiveError) {
        throw new Error(archiveError.message);
      }

      const { data, error } = await supabase
        .from("project_version_prompts")
        .insert(rowPayload)
        .select("*")
        .single();

      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        saved.push(promptRowToItem(data as PromptRow));
      }
      continue;
    }

    const { data, error } = await supabase
      .from("project_version_prompts")
      .update(rowPayload)
      .eq("id", prompt.id)
      .eq("project_id", projectId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    if (data) {
      saved.push(promptRowToItem(data as PromptRow));
    }
  }

  return saved;
}

function createSyntheticDefaultPrompt(
  projectId: string,
  versionKey: string,
): VersionPrompt {
  return {
    id: `synthetic-default-${projectId}-${versionKey}`,
    projectId,
    versionKey,
    promptText: DEFAULT_REPLAY_PROMPT_TEXT,
    responseKind: "replay_intent",
    options: REPLAY_INTENT_OPTIONS,
    sortOrder: 0,
    source: "platform_default",
    createdAt: new Date().toISOString(),
  };
}

export async function ensurePlatformDefaultPrompt(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
): Promise<VersionPrompt> {
  const version = resolvePlayableVersion(versionKey);
  const { data: promptId, error } = await supabase.rpc(
    "ensure_platform_default_prompt",
    {
      p_project_id: projectId,
      p_version_key: version,
    },
  );

  if (!error && promptId) {
    const { data } = await supabase
      .from("project_version_prompts")
      .select("*")
      .eq("id", promptId)
      .single();

    if (data) {
      return promptRowToItem(data as PromptRow);
    }
  }

  const { data: existing } = await supabase
    .from("project_version_prompts")
    .select("*")
    .eq("project_id", projectId)
    .eq("version_key", version)
    .eq("source", "platform_default")
    .is("archived_at", null)
    .maybeSingle();

  if (existing) {
    return promptRowToItem(existing as PromptRow);
  }

  return createSyntheticDefaultPrompt(projectId, version);
}

export async function fetchUserVoiceResponses(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
): Promise<VoiceResponse[]> {
  const version = resolvePlayableVersion(versionKey);
  const { data, error } = await supabase
    .from("project_voice_responses")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("version_key", version);

  if (error) {
    return [];
  }

  return ((data ?? []) as ResponseRow[]).map(responseRowToItem);
}

export async function fetchUserVoiceResponsesForProjects(
  supabase: SupabaseClient,
  userId: string,
  projectIds: string[],
): Promise<VoiceResponse[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_voice_responses")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as ResponseRow[]).map(responseRowToItem);
}

export async function upsertVoiceResponses(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
  answers: VoiceAnswerDraft[],
): Promise<VoiceResponse[]> {
  const version = resolvePlayableVersion(versionKey);
  const results: VoiceResponse[] = [];

  for (const answer of answers) {
    let promptId = answer.promptId;
    if (promptId.startsWith("synthetic-default-")) {
      const ensured = await ensurePlatformDefaultPrompt(
        supabase,
        projectId,
        version,
      );
      promptId = ensured.id;
    }

    const { data: existing } = await supabase
      .from("project_voice_responses")
      .select("id")
      .eq("user_id", userId)
      .eq("prompt_id", promptId)
      .maybeSingle();

    const optionalComment = answer.optionalComment?.trim() || null;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("project_voice_responses")
        .update({
          answer_value: answer.answerValue,
          answer_label: answer.answerLabel ?? null,
          optional_comment: optionalComment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select("*")
        .single();

      if (!error && data) {
        results.push(responseRowToItem(data as ResponseRow));
      }
    } else {
      const { data, error } = await supabase
        .from("project_voice_responses")
        .insert({
          user_id: userId,
          project_id: projectId,
          version_key: version,
          prompt_id: promptId,
          answer_value: answer.answerValue,
          answer_label: answer.answerLabel ?? null,
          optional_comment: optionalComment,
        })
        .select("*")
        .single();

      if (!error && data) {
        results.push(responseRowToItem(data as ResponseRow));
      }
    }
  }

  return results;
}

export async function fetchPublicVoiceAggregates(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
  options?: { includeGuest?: boolean },
): Promise<PublicVoiceAggregateRow[]> {
  const version = resolvePlayableVersion(versionKey);
  const rpcArgs: {
    p_project_id: string;
    p_version_key: string;
    p_include_guest?: boolean;
  } = {
    p_project_id: projectId,
    p_version_key: version,
  };
  if (options?.includeGuest === false) {
    rpcArgs.p_include_guest = false;
  }

  const { data, error } = await supabase.rpc("get_public_voice_aggregates", rpcArgs);

  if (error) {
    return [];
  }

  return (data ?? []) as PublicVoiceAggregateRow[];
}

export async function fetchOwnerVoiceAggregates(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
): Promise<PublicVoiceAggregateRow[]> {
  const version = resolvePlayableVersion(versionKey);
  const { data: prompts, error: promptError } = await supabase
    .from("project_version_prompts")
    .select(
      "id, prompt_text, response_kind, options, sort_order, source, archived_at, created_at",
    )
    .eq("project_id", projectId)
    .eq("version_key", version);

  if (promptError) {
    return [];
  }

  const { data: responses, error: responseError } = await supabase
    .from("project_voice_responses")
    .select("prompt_id, answer_value, answer_label")
    .eq("project_id", projectId)
    .eq("version_key", version);

  if (responseError) {
    return [];
  }

  const { data: guestResponses } = await supabase
    .from("project_guest_voice_responses")
    .select("prompt_id, answer_value, answer_label")
    .eq("project_id", projectId)
    .eq("version_key", version);

  return buildVoiceAggregateRows(
    (prompts ?? []) as PromptAggregateSource[],
    [
      ...((responses ?? []) as {
        prompt_id: string;
        answer_value: string;
        answer_label: string | null;
      }[]),
      ...((guestResponses ?? []) as {
        prompt_id: string;
        answer_value: string;
        answer_label: string | null;
      }[]),
    ],
  );
}

export function hasInitialVoiceComplete(responses: VoiceResponse[]): boolean {
  return responses.length >= 1;
}

export type OwnerVoiceResponseDetail = {
  id: string;
  userId?: string;
  isGuest?: boolean;
  promptId: string;
  promptText: string;
  answerValue: string;
  answerLabel: string | null;
  createdAt: string;
};

export async function fetchOwnerVoiceNurtureSignal(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
): Promise<ProjectVoiceNurtureSignal> {
  const version = resolvePlayableVersion(versionKey);
  const { data, error } = await supabase
    .from("project_voice_responses")
    .select("created_at")
    .eq("project_id", projectId)
    .eq("version_key", version)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return emptyVoiceNurtureSignal(projectId, version);
  }

  const rows = data as { created_at: string }[];

  return {
    projectId,
    playableVersion: version,
    responseCount: rows.length,
    latestResponseAt: rows[0]?.created_at ?? null,
  };
}

export async function fetchVoiceNurtureSignalsForProjects(
  supabase: SupabaseClient,
  projects: { projectId: string; playableVersion: string }[],
): Promise<ProjectVoiceNurtureSignal[]> {
  if (projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((project) => project.projectId);
  const { data, error } = await supabase
    .from("project_voice_responses")
    .select("project_id, version_key, created_at")
    .in("project_id", projectIds);

  if (error || !data) {
    return projects.map((project) =>
      emptyVoiceNurtureSignal(project.projectId, project.playableVersion),
    );
  }

  const grouped = new Map<string, { count: number; latest: string | null }>();

  for (const row of data as {
    project_id: string;
    version_key: string;
    created_at: string;
  }[]) {
    const key = `${row.project_id}:${resolvePlayableVersion(row.version_key)}`;
    const existing = grouped.get(key) ?? { count: 0, latest: null };
    existing.count += 1;

    if (
      !existing.latest ||
      new Date(row.created_at).getTime() > new Date(existing.latest).getTime()
    ) {
      existing.latest = row.created_at;
    }

    grouped.set(key, existing);
  }

  return projects.map((project) => {
    const version = resolvePlayableVersion(project.playableVersion);
    const stats = grouped.get(`${project.projectId}:${version}`);

    return {
      projectId: project.projectId,
      playableVersion: version,
      responseCount: stats?.count ?? 0,
      latestResponseAt: stats?.latest ?? null,
    };
  });
}

export async function fetchOwnerStudioVoiceResponseCount(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
): Promise<number> {
  const version = resolvePlayableVersion(versionKey);
  const [registered, guest] = await Promise.all([
    supabase
      .from("project_voice_responses")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("version_key", version),
    supabase
      .from("project_guest_voice_responses")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("version_key", version),
  ]);

  if (registered.error && guest.error) {
    return 0;
  }

  return (registered.count ?? 0) + (guest.count ?? 0);
}

export async function fetchOwnerVoiceResponseDetails(
  supabase: SupabaseClient,
  projectId: string,
  versionKey: string,
): Promise<OwnerVoiceResponseDetail[]> {
  const version = resolvePlayableVersion(versionKey);
  const [registeredResult, guestResult, promptsResult] = await Promise.all([
    supabase
      .from("project_voice_responses")
      .select("id, user_id, prompt_id, answer_value, answer_label, created_at")
      .eq("project_id", projectId)
      .eq("version_key", version),
    supabase
      .from("project_guest_voice_responses")
      .select("id, prompt_id, answer_value, answer_label, created_at")
      .eq("project_id", projectId)
      .eq("version_key", version),
    supabase
      .from("project_version_prompts")
      .select("id, prompt_text")
      .eq("project_id", projectId)
      .eq("version_key", version),
  ]);

  const promptTextById = new Map(
    ((promptsResult.data ?? []) as { id: string; prompt_text: string }[]).map(
      (prompt) => [prompt.id, prompt.prompt_text],
    ),
  );

  const registered = ((registeredResult.data ?? []) as ResponseRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    isGuest: false as const,
    promptId: row.prompt_id,
    promptText: promptTextById.get(row.prompt_id) ?? "（質問）",
    answerValue: row.answer_value,
    answerLabel: row.answer_label,
    createdAt: row.created_at,
  }));

  const guest = (
    (guestResult.data ?? []) as {
      id: string;
      prompt_id: string;
      answer_value: string;
      answer_label: string | null;
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    isGuest: true as const,
    promptId: row.prompt_id,
    promptText: promptTextById.get(row.prompt_id) ?? "（質問）",
    answerValue: row.answer_value,
    answerLabel: row.answer_label,
    createdAt: row.created_at,
  }));

  return [...registered, ...guest].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
