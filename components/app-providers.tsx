import { AppGateProviders } from "@/components/app-gate-providers";
import { AuthProvider } from "@/components/auth-provider";
import { GamesProvider } from "@/components/games-provider";
import { mapSupabaseUser } from "@/lib/auth";
import { isAnonymousSupabaseUser } from "@/lib/guest-auth";
import { ForgeDeploymentProvider } from "@/lib/forge-deployment-context";
import {
  getForgeDeploymentModeForServer,
  shouldServeFutureDiscoveryHome,
} from "@/lib/production-mode";
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

    if (user && !isAnonymousSupabaseUser(user)) {
      initialUser = mapSupabaseUser(user);
    }
  }

  const deploymentMode = getForgeDeploymentModeForServer();
  const serveFutureDiscoveryHome = shouldServeFutureDiscoveryHome();
  return (
    <ForgeDeploymentProvider
      mode={deploymentMode}
      serveFutureDiscoveryHome={serveFutureDiscoveryHome}
    >
      <AuthProvider initialUser={initialUser}>
        <GamesProvider>
          <AppGateProviders>{children}</AppGateProviders>
        </GamesProvider>
      </AuthProvider>
    </ForgeDeploymentProvider>
  );
}
