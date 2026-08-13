/**
 * Production READ-ONLY audit for watch-update 102/103 preflight.
 * Uses .env.production.local. Aborts unless URL is Production ref.
 * Never INSERT/UPDATE/DELETE/DDL.
 *
 *   node --env-file=.env.production.local scripts/production-rollout/2026-08/read-only-prod-watch-102-103-preflight.mjs
 */
import { createClient } from "@supabase/supabase-js";

const PROD = "bpnisgzxuwdxelhnduuf";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

if (!url.includes(PROD)) {
  console.error("ABORT: not Production URL", url.slice(0, 40));
  process.exit(1);
}
if (!key) {
  console.error("ABORT: missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function rpcSql(label, query) {
  // Prefer postgrest cannot run arbitrary SQL; use REST via pg if available.
  // Fall back: use supabase.rpc only if a helper exists — instead call via fetch to SQL not available.
  // Use the Management-less approach: select from information_schema via a raw query through
  // the postgres REST isn't supported. Use `sb.schema('public')` won't work for catalogs.
  //
  // Service role + supabase-js cannot query information_schema easily without a DB function.
  // Use the PostgREST-accessible tables for coalesce preflight; for grants use fetch to
  // Supabase SQL is not exposed. We'll use the `postgres` connection string if present,
  // else attempt `rpc('exec_sql')` and fail clearly.
  void label;
  void query;
}

// Use @supabase/supabase-js with the undocumented REST is insufficient.
// Connect via pg if DATABASE_URL / DIRECT_URL exists; else use supabase.from for coalesce only
// and document GRANT audit as Owner Dashboard SQL.

const pgUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  process.env.PROD_DATABASE_URL?.trim() ||
  "";

if (!pgUrl) {
  // Coalesce duplicate check via table API (service_role)
  const { data, error } = await sb
    .from("user_notifications")
    .select("id, user_id, coalesce_key, type, created_at")
    .like("coalesce_key", "watch-update:%")
    .limit(5000);

  if (error) {
    console.error("FAIL coalesce select", error.message);
    process.exit(1);
  }

  const rows = data || [];
  const groups = new Map();
  for (const row of rows) {
    const k = `${row.user_id}::${row.coalesce_key}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(row);
  }
  const dups = [...groups.entries()].filter(([, v]) => v.length > 1);
  let deleteTarget = 0;
  for (const [, v] of dups) deleteTarget += v.length - 1;

  console.log(
    JSON.stringify(
      {
        mode: "table-api-only",
        watch_update_coalesce_rows: rows.length,
        duplicate_groups: dups.length,
        rows_that_103_would_delete: deleteTarget,
        note: "GRANT/RLS require SQL Editor or DATABASE_URL; Owner must run audit SQL if this mode.",
        sample_dup_keys: dups.slice(0, 20).map(([k, v]) => ({
          key: k,
          count: v.length,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const grants = await client.query(`
    SELECT grantee, privilege_type
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name = 'project_watches'
      AND grantee IN ('authenticated', 'anon')
    ORDER BY 1, 2
  `);

  const rls = await client.query(`
    SELECT c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'project_watches'
  `);

  const policies = await client.query(`
    SELECT pol.polname, pol.polcmd,
           pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
           pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'project_watches'
    ORDER BY 1
  `);

  const index = await client.query(`
    SELECT i.relname, ix.indisunique,
           pg_get_expr(ix.indpred, ix.indrelid) AS predicate
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'user_notifications'
      AND i.relname = 'user_notifications_watch_update_coalesce_uidx'
  `);

  const dups = await client.query(`
    SELECT user_id::text, coalesce_key, count(*)::int AS row_count
    FROM public.user_notifications
    WHERE coalesce_key LIKE 'watch-update:%'
    GROUP BY user_id, coalesce_key
    HAVING count(*) > 1
    ORDER BY row_count DESC
    LIMIT 100
  `);

  const totals = await client.query(`
    SELECT count(*)::int AS watch_update_coalesce_rows,
           coalesce(sum(GREATEST(cnt - 1, 0)), 0)::int AS rows_103_would_delete
    FROM (
      SELECT count(*) AS cnt
      FROM public.user_notifications
      WHERE coalesce_key LIKE 'watch-update:%'
      GROUP BY user_id, coalesce_key
    ) s
  `);

  const authPrivs = grants.rows
    .filter((r) => r.grantee === "authenticated")
    .map((r) => r.privilege_type);
  const gap = ["SELECT", "INSERT", "DELETE"].filter((p) => !authPrivs.includes(p));

  console.log(
    JSON.stringify(
      {
        project: PROD,
        grants: grants.rows,
        authenticated_missing: gap,
        rls_enabled: rls.rows[0]?.rls_enabled ?? null,
        policies: policies.rows,
        watch_update_unique_index: index.rows,
        watch_update_coalesce_rows: totals.rows[0]?.watch_update_coalesce_rows ?? 0,
        duplicate_groups: dups.rows.length,
        rows_that_103_would_delete: totals.rows[0]?.rows_103_would_delete ?? 0,
        duplicate_group_list: dups.rows,
        go_or_block:
          dups.rows.length === 0
            ? gap.length
              ? "GO_WITH_102_NEEDED"
              : index.rows.length
                ? "ALREADY_APPLIED_OR_READY"
                : "GO_103_SAFE_ZERO_DUP"
            : "BLOCK_DUPLICATES",
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
