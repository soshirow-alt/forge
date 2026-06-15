import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePlayableVersion } from "@/lib/playable-version";

const VOICE_READ_SOURCE = "voice" as const;

export async function fetchVoiceReadForVersion(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
): Promise<boolean> {
  const version = resolvePlayableVersion(versionKey);
  const { data, error } = await supabase
    .from("project_voice_reads")
    .select("read_at")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("version_key", version)
    .eq("source_type", VOICE_READ_SOURCE)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return Boolean(data.read_at);
}

export async function upsertVoiceReadForVersion(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  versionKey: string,
): Promise<void> {
  const version = resolvePlayableVersion(versionKey);
  const readAt = new Date().toISOString();

  const { error } = await supabase.from("project_voice_reads").upsert(
    {
      user_id: userId,
      project_id: projectId,
      version_key: version,
      source_type: VOICE_READ_SOURCE,
      read_at: readAt,
    },
    { onConflict: "user_id,project_id,version_key,source_type" },
  );

  if (error) {
    throw error;
  }
}
