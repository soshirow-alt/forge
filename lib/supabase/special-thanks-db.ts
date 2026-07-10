import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type SpecialThanksEntry,
  type SpecialThanksEntryInput,
  validateSpecialThanksInput,
} from "@/lib/special-thanks";

type SpecialThanksRow = {
  id: string;
  display_name: string;
  handle: string | null;
  role_label: string | null;
  url: string | null;
  note: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS =
  "id, display_name, handle, role_label, url, note, sort_order, is_published, created_at, updated_at";

function mapRow(row: SpecialThanksRow): SpecialThanksEntry {
  return {
    id: row.id,
    displayName: row.display_name,
    handle: row.handle,
    roleLabel: row.role_label,
    url: row.url,
    note: row.note,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isSpecialThanksTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    message.includes("special_thanks_entries") &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function listPublishedSpecialThanks(
  supabase: SupabaseClient,
  options?: { limit?: number },
): Promise<SpecialThanksEntry[]> {
  let query = supabase
    .from("special_thanks_entries")
    .select(SELECT_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (options?.limit != null) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    if (isSpecialThanksTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as SpecialThanksRow[]).map(mapRow);
}

export async function listAllSpecialThanksForAdmin(
  supabase: SupabaseClient,
): Promise<SpecialThanksEntry[]> {
  const { data, error } = await supabase
    .from("special_thanks_entries")
    .select(SELECT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (isSpecialThanksTableMissingError(error)) {
      throw new Error("special_thanks_table_missing");
    }
    throw error;
  }

  return ((data ?? []) as SpecialThanksRow[]).map(mapRow);
}

export async function createSpecialThanksEntry(
  supabase: SupabaseClient,
  userId: string,
  input: SpecialThanksEntryInput,
): Promise<SpecialThanksEntry> {
  const validated = validateSpecialThanksInput(input);
  const { data, error } = await supabase
    .from("special_thanks_entries")
    .insert({
      display_name: validated.displayName,
      handle: validated.handle,
      role_label: validated.roleLabel,
      url: validated.url,
      note: validated.note,
      sort_order: validated.sortOrder,
      is_published: validated.isPublished,
      created_by: userId,
      updated_by: userId,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (isSpecialThanksTableMissingError(error)) {
      throw new Error("special_thanks_table_missing");
    }
    throw error;
  }

  return mapRow(data as SpecialThanksRow);
}

export async function updateSpecialThanksEntry(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: SpecialThanksEntryInput,
): Promise<SpecialThanksEntry> {
  const validated = validateSpecialThanksInput(input);
  const { data, error } = await supabase
    .from("special_thanks_entries")
    .update({
      display_name: validated.displayName,
      handle: validated.handle,
      role_label: validated.roleLabel,
      url: validated.url,
      note: validated.note,
      sort_order: validated.sortOrder,
      is_published: validated.isPublished,
      updated_by: userId,
    })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (isSpecialThanksTableMissingError(error)) {
      throw new Error("special_thanks_table_missing");
    }
    throw error;
  }

  return mapRow(data as SpecialThanksRow);
}
