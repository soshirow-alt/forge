import { readFileSync, writeFileSync } from "node:fs";

const final = readFileSync(
  "supabase/migrations/055_fix_home_discovery_feed_variable_conflict.sql",
  "utf8",
);
const fnStart = final.indexOf("CREATE OR REPLACE FUNCTION");
const fnEnd = final.lastIndexOf("\nCOMMIT;");
if (fnStart < 0 || fnEnd < 0) throw new Error("bad 055");
const fnBlock = `${final.slice(fnStart, fnEnd).trim()}\n`;

const m052 = readFileSync("supabase/migrations/052_home_discovery_feed_rpc.sql", "utf8");
const idxEnd = m052.indexOf("CREATE OR REPLACE FUNCTION");
const beginIdx = m052.indexOf("BEGIN;");
if (idxEnd < 0 || beginIdx < 0) throw new Error("bad 052");
const indexes = m052.slice(beginIdx, idxEnd);

const header052 = `-- 052: get_home_discovery_feed — home discovery sections (newest / updated / trending)
-- Staging-first. Do NOT apply to production without owner GO.
--
-- Card stats: reuses get_public_project_stats(uuid[]) once per call (Option A).
-- Does NOT copy feedback/watch aggregation SQL.
-- Does NOT use project_supports.
-- project_id joins prefer text = id::text (no unsafe text::uuid casts on event tables).
-- Function body aligned with definitive LANGUAGE sql definition (see 055).

`;

writeFileSync(
  "supabase/migrations/052_home_discovery_feed_rpc.sql",
  `${header052}${indexes}${fnBlock}\nCOMMIT;\n`,
);

function wrap(num, title) {
  return `-- ${num}: ${title}
-- Body is the definitive LANGUAGE sql definition (same as 055) so fresh
-- 050→055 and Staging (through 054) + 055 alone converge on one function.
-- Staging-first. DO NOT apply to production without owner GO.

BEGIN;

${fnBlock}
COMMIT;
`;
}

writeFileSync(
  "supabase/migrations/053_fix_home_discovery_feed_rank_ambiguity.sql",
  wrap("053", "get_home_discovery_feed definitive body (was rank ORDER BY patch)"),
);
writeFileSync(
  "supabase/migrations/054_fix_home_discovery_feed_plpgsql_rank_clash.sql",
  wrap("054", "get_home_discovery_feed definitive body (was plpgsql rank→rn patch)"),
);

console.log("synced 052/053/054 to 055 function body");
