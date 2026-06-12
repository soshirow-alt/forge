import { AuthProvider } from "@/components/auth-provider";
import { GamesProvider } from "@/components/games-provider";
import { mapSupabaseUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialUser = null;
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      initialUser = mapSupabaseUser(user);
    }
  }

  return (
    <AuthProvider initialUser={initialUser}>
      <GamesProvider>{children}</GamesProvider>
    </AuthProvider>
  );
}
