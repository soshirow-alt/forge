import { AppGateProviders } from "@/components/app-gate-providers";
import { AuthProvider } from "@/components/auth-provider";
import { GamesProvider } from "@/components/games-provider";
import { mapSupabaseUser } from "@/lib/auth";
import { ForgeDeploymentProvider } from "@/lib/forge-deployment-context";
import { getForgeDeploymentModeForServer } from "@/lib/production-mode";
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

  const deploymentMode = getForgeDeploymentModeForServer();
  return (
    <ForgeDeploymentProvider mode={deploymentMode}>
      <AuthProvider initialUser={initialUser}>
        <GamesProvider>
          <AppGateProviders>{children}</AppGateProviders>
        </GamesProvider>
      </AuthProvider>
    </ForgeDeploymentProvider>
  );
}
