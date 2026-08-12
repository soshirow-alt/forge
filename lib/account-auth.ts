import type { SupabaseClient } from "@supabase/supabase-js";
import { getEmailChangeRedirectUrl } from "@/lib/auth-redirect";
import { ACCOUNT_PASSWORD_MIN_LENGTH } from "@/lib/account-settings";

export async function reauthenticateWithPassword(
  supabase: SupabaseClient,
  email: string,
  currentPassword: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (error) {
    throw error;
  }
}

export async function changePasswordWithReauth(
  supabase: SupabaseClient,
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < ACCOUNT_PASSWORD_MIN_LENGTH) {
    throw new Error("Password should be at least 8 characters");
  }

  await reauthenticateWithPassword(supabase, email, currentPassword);

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw updateError;
  }

  await supabase.auth.signOut();
}

export async function changeEmailWithReauth(
  supabase: SupabaseClient,
  email: string,
  currentPassword: string,
  newEmail: string,
  settingsPath?: string | null,
): Promise<void> {
  const trimmed = newEmail.trim();
  if (!trimmed.includes("@")) {
    throw new Error("Unable to validate email address: invalid format");
  }

  await reauthenticateWithPassword(supabase, email, currentPassword);

  const { error: updateError } = await supabase.auth.updateUser(
    { email: trimmed },
    { emailRedirectTo: getEmailChangeRedirectUrl(settingsPath) },
  );

  if (updateError) {
    throw updateError;
  }
}
