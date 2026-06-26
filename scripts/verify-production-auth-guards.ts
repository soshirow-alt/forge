/**
 * REL-0-02 — production auth guard matrix (no server required).
 *
 * Usage: npx tsx scripts/verify-production-auth-guards.ts
 */
import type { ForgeDeploymentMode } from "../lib/production-mode";
import {
  getForgeDeploymentMode,
  isProductionReleaseMode,
  shouldBypassStudioLoginGate,
  shouldRedirectRootToDiscoveryHome,
} from "../lib/production-mode";

type EnvSnapshot = Record<string, string | undefined>;

type Case = {
  name: string;
  host: string;
  env?: EnvSnapshot;
  expect: {
    mode: ForgeDeploymentMode;
    bypass: boolean;
    rootRedirect: boolean;
  };
};

const BASE_ENV: EnvSnapshot = {
  NEXT_PUBLIC_FORGE_PRODUCTION_MODE: undefined,
  FORGE_PRODUCTION_MODE: undefined,
  NEXT_PUBLIC_FORGE_PREVIEW_V0: undefined,
  VERCEL_ENV: undefined,
  VERCEL_GIT_COMMIT_REF: undefined,
  NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: undefined,
};

const CASES: Case[] = [
  {
    name: "production hostname + preview git ref must NOT bypass",
    host: "forge.example.com",
    env: { VERCEL_GIT_COMMIT_REF: "preview/landing-01" },
    expect: { mode: "production", bypass: false, rootRedirect: false },
  },
  {
    name: "VERCEL_ENV=production forces production even on preview branch ref",
    host: "anything.vercel.app",
    env: {
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_REF: "preview/landing-01",
    },
    expect: { mode: "production", bypass: false, rootRedirect: false },
  },
  {
    name: "preview-landing-01 hostname allows bypass",
    host: "forge-preview-landing-01.vercel.app",
    env: { VERCEL_GIT_COMMIT_REF: "preview/landing-01" },
    expect: { mode: "preview", bypass: true, rootRedirect: true },
  },
  {
    name: "Vercel preview slot + preview branch allows bypass",
    host: "forge-abc123.vercel.app",
    env: {
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "preview/landing-01",
    },
    expect: { mode: "preview", bypass: true, rootRedirect: true },
  },
  {
    name: "localhost default is local with bypass",
    host: "localhost",
    expect: { mode: "local", bypass: true, rootRedirect: false },
  },
  {
    name: "localhost + FORGE_PRODUCTION_MODE forces no bypass",
    host: "localhost",
    env: { NEXT_PUBLIC_FORGE_PRODUCTION_MODE: "true" },
    expect: { mode: "production", bypass: false, rootRedirect: false },
  },
  {
    name: "localhost + preview branch is preview with bypass",
    host: "localhost",
    env: { VERCEL_GIT_COMMIT_REF: "preview/landing-01" },
    expect: { mode: "preview", bypass: true, rootRedirect: true },
  },
];

function applyEnv(env: EnvSnapshot) {
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...env })) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function snapshotEnv(): EnvSnapshot {
  return {
    NEXT_PUBLIC_FORGE_PRODUCTION_MODE: process.env.NEXT_PUBLIC_FORGE_PRODUCTION_MODE,
    FORGE_PRODUCTION_MODE: process.env.FORGE_PRODUCTION_MODE,
    NEXT_PUBLIC_FORGE_PREVIEW_V0: process.env.NEXT_PUBLIC_FORGE_PREVIEW_V0,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
    NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
  };
}

function main() {
  const saved = snapshotEnv();
  let failed = 0;

  try {
    for (const testCase of CASES) {
      applyEnv(testCase.env ?? {});
      const mode = getForgeDeploymentMode(testCase.host);
      const bypass = shouldBypassStudioLoginGate(testCase.host);
      const rootRedirect = shouldRedirectRootToDiscoveryHome(testCase.host);
      const production = isProductionReleaseMode(testCase.host);

      const ok =
        mode === testCase.expect.mode &&
        bypass === testCase.expect.bypass &&
        rootRedirect === testCase.expect.rootRedirect &&
        (testCase.expect.mode === "production") === production;

      if (ok) {
        console.log(`PASS  ${testCase.name}`);
      } else {
        failed += 1;
        console.log(`FAIL  ${testCase.name}`);
        console.log(
          `      got mode=${mode} bypass=${bypass} rootRedirect=${rootRedirect} production=${production}`,
        );
        console.log(`      expected`, testCase.expect);
      }
    }
  } finally {
    applyEnv(saved);
  }

  if (failed > 0) {
    console.error(`\n${failed} case(s) failed`);
    process.exit(1);
  }

  console.log(`\nAll ${CASES.length} production auth guard cases passed.`);
  console.log(
    "Manual: production mode — /studio /mypage /notifications redirect when logged out;",
  );
  console.log(
    "play / FB / witness / save on /games/[id] use useRequireAuth (client gate).",
  );
}

main();
