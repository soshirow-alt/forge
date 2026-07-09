/**
 * Unit matrix for lib/supabase/write-guard.ts and scripts/lib/supabase-write-guard.mjs.
 * No DB access.
 *
 * Usage: npm run verify:supabase-write-guard
 */
import {
  assertSupabaseWriteAllowed as assertTs,
  getSupabaseProjectRef as getSupabaseProjectRefTs,
  isVercelProductionDeployment,
} from "../lib/supabase/write-guard";
import {
  assertSupabaseWriteAllowed as assertMjs,
  getSupabaseProjectRef as getSupabaseProjectRefMjs,
  SupabaseWriteGuardError as SupabaseWriteGuardErrorMjs,
} from "./lib/supabase-write-guard.mjs";
import { createServiceRoleClient } from "../lib/supabase/service-role";

const PROD = "bpnisgzxuwdxelhnduuf";
const STAGING = "stagingref123456";
const CONTEXT = "verify-supabase-write-guard";

type Snapshot = Record<string, string | undefined>;

type GuardImpl = {
  label: "ts" | "mjs";
  assert: (context: string) => void;
};

const GUARD_IMPLS: GuardImpl[] = [
  { label: "ts", assert: assertTs },
  { label: "mjs", assert: assertMjs },
];

function withEnv(
  snapshot: Snapshot,
  fn: () => void,
): { threw: boolean; error?: string; errorName?: string } {
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
  let errorName: string | undefined;
  try {
    fn();
  } catch (err) {
    threw = true;
    error = err instanceof Error ? err.message : String(err);
    errorName = err instanceof Error ? err.name : undefined;
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  return { threw, error, errorName };
}

type Case = {
  name: string;
  env: Snapshot;
  expectAllow: boolean;
};

/** Shared matrix — both TS and mjs implementations must match. */
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

type ImplOutcome = {
  allowed: boolean;
  error?: string;
  errorName?: string;
};

function runGuard(impl: GuardImpl, env: Snapshot): ImplOutcome {
  const result = withEnv(env, () => {
    impl.assert(CONTEXT);
  });
  return {
    allowed: !result.threw,
    error: result.error,
    errorName: result.errorName,
  };
}

function main(): void {
  let failed = 0;

  const prodUrl = `https://${PROD}.supabase.co`;
  if (getSupabaseProjectRefTs(prodUrl) !== PROD) {
    console.error("FAIL ts ref extraction");
    process.exit(1);
  }
  if (getSupabaseProjectRefMjs(prodUrl) !== PROD) {
    console.error("FAIL mjs ref extraction");
    process.exit(1);
  }
  console.log("PASS getSupabaseProjectRef parity (ts / mjs)");

  if (isVercelProductionDeployment()) {
    console.log("SKIP isVercelProductionDeployment — set in CI only");
  }

  for (const testCase of CASES) {
    const outcomes = GUARD_IMPLS.map((impl) => ({
      impl,
      outcome: runGuard(impl, testCase.env),
    }));

    for (const { impl, outcome } of outcomes) {
      const ok = outcome.allowed === testCase.expectAllow;
      console.log(`${ok ? "PASS" : "FAIL"} [${impl.label}] ${testCase.name}`);
      if (!ok) {
        failed += 1;
        console.log(
          `  expected allow=${testCase.expectAllow}, got allow=${outcome.allowed}`,
        );
        if (outcome.error) {
          console.log(`  error: ${outcome.error.slice(0, 120)}`);
        }
      }
    }

    const [tsOutcome, mjsOutcome] = outcomes.map((o) => o.outcome);
    const parityAllow = tsOutcome.allowed === mjsOutcome.allowed;
    const parityReason =
      tsOutcome.error === mjsOutcome.error &&
      tsOutcome.errorName === mjsOutcome.errorName;
    const parityOk = parityAllow && parityReason;

    console.log(`${parityOk ? "PASS" : "FAIL"} [parity] ${testCase.name}`);
    if (!parityOk) {
      failed += 1;
      if (!parityAllow) {
        console.log(
          `  allow mismatch: ts=${tsOutcome.allowed} mjs=${mjsOutcome.allowed}`,
        );
      }
      if (!parityReason) {
        console.log(`  ts error: ${tsOutcome.error ?? "(none)"}`);
        console.log(`  mjs error: ${mjsOutcome.error ?? "(none)"}`);
        console.log(
          `  errorName: ts=${tsOutcome.errorName ?? "(none)"} mjs=${mjsOutcome.errorName ?? "(none)"}`,
        );
      }
    }
  }

  const errorTypeTs = withEnv(
    {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    () => {
      assertTs("verify");
    },
  );
  const errorTypeMjs = withEnv(
    {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    () => {
      assertMjs("verify");
    },
  );

  const tsErrorOk =
    errorTypeTs.threw && errorTypeTs.errorName === "SupabaseWriteGuardError";
  const mjsErrorOk =
    errorTypeMjs.threw && errorTypeMjs.errorName === "SupabaseWriteGuardError";
  const errorParityOk = errorTypeTs.error === errorTypeMjs.error;

  console.log(`${tsErrorOk ? "PASS" : "FAIL"} [ts] throws SupabaseWriteGuardError`);
  console.log(`${mjsErrorOk ? "PASS" : "FAIL"} [mjs] throws SupabaseWriteGuardError`);
  console.log(
    `${errorParityOk ? "PASS" : "FAIL"} [parity] SupabaseWriteGuardError message`,
  );
  if (!tsErrorOk || !mjsErrorOk || !errorParityOk) {
    failed += 1;
  }

  const restoreBlock = withEnv(
    {
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PROD}.supabase.co`,
      FORGE_PRODUCTION_SUPABASE_REF: PROD,
    },
    () => {
      assertMjs("tmp-restore-incident-thumbs");
    },
  );
  if (!restoreBlock.threw) {
    console.log("FAIL [mjs] restore context blocks prod write");
    failed += 1;
  } else {
    console.log("PASS [mjs] restore context blocks prod write");
  }

  if (failed > 0) {
    process.exit(1);
  }

  console.log(
    `\nAll ${CASES.length} cases passed for ts + mjs (${CASES.length * 2} impl runs, ${CASES.length} parity checks).`,
  );

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

  // Sanity: mjs error class name matches TS
  if (new SupabaseWriteGuardErrorMjs("x").name !== "SupabaseWriteGuardError") {
    console.error("FAIL mjs SupabaseWriteGuardError class name");
    process.exit(1);
  }
  console.log("PASS mjs SupabaseWriteGuardError class name");
}

main();
