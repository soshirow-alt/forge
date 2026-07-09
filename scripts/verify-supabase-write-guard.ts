/**
 * Unit matrix for lib/supabase/write-guard.ts (no DB access).
 *
 * Usage: npx tsx scripts/verify-supabase-write-guard.ts
 */
import {
  assertSupabaseWriteAllowed,
  getSupabaseProjectRef,
  isVercelProductionDeployment,
  SupabaseWriteGuardError,
} from "../lib/supabase/write-guard";
import { createServiceRoleClient } from "../lib/supabase/service-role";

const PROD = "bpnisgzxuwdxelhnduuf";
const STAGING = "stagingref123456";

type Snapshot = Record<string, string | undefined>;

function withEnv(
  snapshot: Snapshot,
  fn: () => void,
): { threw: boolean; error?: string } {
  const saved = new Map<string, string | undefined>();
  for (const key of Object.keys(snapshot)) {
    saved.set(key, process.env[key]);
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  let threw = false;
  let error: string | undefined;
  try {
    fn();
  } catch (err) {
    threw = true;
    error = err instanceof Error ? err.message : String(err);
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  return { threw, error };
}

type Case = {
  name: string;
  env: Snapshot;
  expectAllow: boolean;
};

const CASES: Case[] = [
  {
    name: "Vercel production + prod URL",
    env: {
      VERCEL_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    expectAllow: true,
  },
  {
    name: "local + staging URL",
    env: {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    expectAllow: true,
  },
  {
    name: "Vercel preview + prod URL",
    env: {
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    expectAllow: false,
  },
  {
    name: "local + prod URL",
    env: {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    expectAllow: false,
  },
  {
    name: "local + prod URL + explicit allow",
    env: {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
      FORGE_ALLOW_PRODUCTION_SUPABASE_WRITE: "1",
    },
    expectAllow: true,
  },
  {
    name: "fail closed — prodRef unset",
    env: {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: undefined,
    },
    expectAllow: false,
  },
  {
    name: "fail closed — targetRef missing",
    env: {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    expectAllow: false,
  },
  {
    name: "FORGE_PRODUCTION_MODE does not allow prod write",
    env: {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
      FORGE_PRODUCTION_MODE: "true",
    },
    expectAllow: false,
  },
];

function main(): void {
  const ref = getSupabaseProjectRef(`https://${PROD}.supabase.co`);
  if (ref !== PROD) {
    console.error("FAIL ref extraction");
    process.exit(1);
  }

  if (isVercelProductionDeployment()) {
    console.log("SKIP isVercelProductionDeployment — set in CI only");
  }

  let failed = 0;
  for (const testCase of CASES) {
    const result = withEnv(testCase.env, () => {
      assertSupabaseWriteAllowed("verify-supabase-write-guard");
    });

    const allowed = !result.threw;
    const ok = allowed === testCase.expectAllow;
    console.log(`${ok ? "PASS" : "FAIL"} ${testCase.name}`);
    if (!ok) {
      failed += 1;
      console.log(`  expected allow=${testCase.expectAllow}, got allow=${allowed}`);
      if (result.error) {
        console.log(`  error: ${result.error.slice(0, 120)}`);
      }
    }
  }

  const mustThrow = withEnv(
    {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    () => {
      assertSupabaseWriteAllowed("verify");
    },
  );
  if (!mustThrow.threw || !mustThrow.error?.includes("[supabase-write-guard]")) {
    console.log("FAIL error type");
    failed += 1;
  } else {
    console.log("PASS throws SupabaseWriteGuardError");
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log(`\nAll ${CASES.length} cases passed.`);

  // createServiceRoleClient integration (no network)
  const blocked = withEnv(
    {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      SUPABASE_SERVICE_ROLE_KEY: "test-key-not-real",
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    () => {
      createServiceRoleClient();
    },
  );
  if (!blocked.threw) {
    console.error("FAIL createServiceRoleClient should block prod from local");
    process.exit(1);
  }
  console.log("PASS createServiceRoleClient blocks non-production prod write");

  const allowed = withEnv(
    {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING}.supabase.co`,
      SUPABASE_SERVICE_ROLE_KEY: "test-key-not-real",
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    () => {
      const client = createServiceRoleClient();
      if (!client) {
        throw new Error("expected client");
      }
    },
  );
  if (allowed.threw) {
    console.error("FAIL createServiceRoleClient should allow staging from local");
    process.exit(1);
  }
  console.log("PASS createServiceRoleClient allows staging from local");
}

main();
