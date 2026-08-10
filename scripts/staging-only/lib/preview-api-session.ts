/**
 * Build Cookie header for Preview alias Route Handlers (Supabase SSR cookies).
 */

import { createServerClient } from "@supabase/ssr";
import { requireEnv } from "./preview-e2e-env";

type Env = Record<string, string>;

export async function buildPreviewAuthCookieHeader(input: {
  env: Env;
  accessToken: string;
  refreshToken: string;
}): Promise<string> {
  const url = requireEnv(input.env, "NEXT_PUBLIC_SUPABASE_URL");
  const anon = requireEnv(input.env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const jar: { name: string; value: string }[] = [];

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return jar;
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const index = jar.findIndex((entry) => entry.name === cookie.name);
          if (!cookie.value) {
            if (index >= 0) jar.splice(index, 1);
            continue;
          }
          if (index >= 0) {
            jar[index] = { name: cookie.name, value: cookie.value };
          } else {
            jar.push({ name: cookie.name, value: cookie.value });
          }
        }
      },
    },
  });

  const { error } = await supabase.auth.setSession({
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
  });
  if (error) {
    throw new Error(`setSession for Preview cookie failed: ${error.message}`);
  }
  if (jar.length === 0) {
    throw new Error("Preview auth cookie jar empty after setSession");
  }
  return jar.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}
