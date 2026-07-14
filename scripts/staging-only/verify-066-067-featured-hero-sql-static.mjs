/**
 * Local static verify for 066/067 get_home_featured_hero SQL
 * (no DB apply). Checks:
 * - RETURNS TABLE vs final SELECT column count/order/names
 * - picked UNION ALL branches: same column count & aliases
 * - no plpgsql / temp table / DROP TABLE in function body
 * - DROP + CREATE + GRANT present
 * - 066 and 067 function bodies identical
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PATH_066 = resolve(ROOT, "supabase/migrations/066_home_featured_hero_four_slots.sql");
const PATH_067 = resolve(ROOT, "supabase/migrations/067_fix_home_featured_hero_sql_stable.sql");

/** Canonical intermediate slot row used by ranked / pick / picked CTEs */
const CANONICAL_SLOT_COLS = [
  "project_id",
  "owner_id",
  "feedback_users_7d",
  "watchers_7d",
  "players_7d",
  "players_prev_7d",
  "player_delta_7d",
  "last_play_at",
  "last_engagement_at",
  "first_published_at",
  "meaningful_update_at",
  "update_kind",
  "axis_rank",
];

const PICKED_PREFIX = ["featured_type", "desired_order"];

function extractFunctionBody(sql) {
  const m = sql.match(/AS\s+\$\$([\s\S]*?)\$\$;/);
  if (!m) throw new Error("function body not found");
  return m[1];
}

function extractReturnsTable(sql) {
  const m = sql.match(/RETURNS\s+TABLE\s*\(([\s\S]*?)\)\s*LANGUAGE/i);
  if (!m) throw new Error("RETURNS TABLE not found");
  return m[1]
    .split(",")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      return { name: parts[0], type: parts.slice(1).join(" ") };
    });
}

/** Split a SELECT list on top-level commas (paren-aware). */
function splitSelectList(selectList) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selectList.length; i++) {
    const ch = selectList[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === "," && depth === 0) {
      parts.push(selectList.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = selectList.slice(start).trim();
  if (last) parts.push(last);
  return parts.filter(Boolean);
}

function aliasFromSelectExpr(expr, label) {
  const as = expr.match(/\bAS\s+([a-z_][a-z0-9_]*)\s*$/i);
  if (as) return as[1];
  const bare = expr.match(/\.([a-z_][a-z0-9_]*)\s*$/i);
  if (bare) return bare[1];
  const ident = expr.match(/^([a-z_][a-z0-9_]*)\s*$/i);
  if (ident) return ident[1];
  throw new Error(`cannot parse ${label} col: ${expr.slice(0, 80)}`);
}

function extractFinalSelectAliases(body) {
  // Outer final SELECT (after stats CTE), CRLF-safe.
  const m = body.match(
    /\)\s*\r?\n\s+SELECT\r?\n([\s\S]*?)\r?\n\s+FROM picked_ranked pr\r?\n\s+INNER JOIN public_projects pp[\s\S]*?ORDER BY pr\.slot_rank ASC;/,
  );
  if (!m) throw new Error("final SELECT not found");
  return splitSelectList(m[1]).map((expr) =>
    aliasFromSelectExpr(expr, "final SELECT"),
  );
}

function extractCteSelectAliases(body, cteName) {
  const re = new RegExp(
    `${cteName}\\s+AS\\s*\\(\\s*SELECT\\s+([\\s\\S]*?)\\s+FROM\\s+`,
    "i",
  );
  const m = body.match(re);
  if (!m) throw new Error(`CTE ${cteName} SELECT not found`);
  const selectList = m[1];
  if (/(^|[,\s])\*(?:[,\s]|$)/.test(selectList.replace(/\s+/g, " "))) {
    return { aliases: ["*"], raw: selectList, hasStar: true };
  }
  const aliases = splitSelectList(selectList).map((expr) =>
    aliasFromSelectExpr(expr, cteName),
  );
  return { aliases, raw: selectList, hasStar: false };
}

function extractPickedUnionBranches(body) {
  const m = body.match(
    /picked\s+AS\s*\(\s*([\s\S]*?)\r?\n\s*\),\s*\r?\n\s*picked_ranked/i,
  );
  if (!m) throw new Error("picked CTE not found");
  const inner = m[1];
  const parts = inner.split(/\r?\n\s*UNION ALL\s*\r?\n/i);
  return parts.map((part, idx) => {
    const sm = part.match(/SELECT\s+([\s\S]*?)\s+FROM\s+/i);
    if (!sm) throw new Error(`picked branch ${idx} SELECT missing`);
    const selectList = sm[1].trim();
    if (/(^|[,\s])\*(?:[,\s]|$)/.test(selectList.replace(/\s+/g, " "))) {
      return { index: idx, aliases: ["*"], hasStar: true, raw: selectList };
    }
    const aliases = splitSelectList(selectList).map((expr) =>
      aliasFromSelectExpr(expr, `picked[${idx}]`),
    );
    return { index: idx, aliases, hasStar: false, raw: selectList };
  });
}

function assertNoTempOrPlpgsql(body, label) {
  const issues = [];
  if (/\bDROP\s+TABLE\b/i.test(body)) issues.push("DROP TABLE in body");
  if (/\bCREATE\s+TEMP(?:ORARY)?\s+TABLE\b/i.test(body)) {
    issues.push("CREATE TEMP TABLE in body");
  }
  if (/\blanguage\s+plpgsql\b/i.test(body)) issues.push("plpgsql in body");
  if (issues.length) {
    throw new Error(`${label}: ${issues.join("; ")}`);
  }
}

function verifyFile(path, label) {
  const sql = readFileSync(path, "utf8");
  const body = extractFunctionBody(sql);
  const returns = extractReturnsTable(sql);
  const finalAliases = extractFinalSelectAliases(body);
  const issues = [];

  if (!/LANGUAGE\s+sql/i.test(sql)) issues.push("LANGUAGE is not sql");
  if (!/\bSTABLE\b/.test(sql)) issues.push("missing STABLE");
  if (!/SECURITY\s+DEFINER/i.test(sql)) issues.push("missing SECURITY DEFINER");
  if (!/DROP\s+FUNCTION\s+IF\s+EXISTS\s+public\.get_home_featured_hero\s*\(\s*\)/i.test(sql)) {
    issues.push("missing DROP FUNCTION ()");
  }
  if (!/CREATE\s+FUNCTION\s+public\.get_home_featured_hero\s*\(\s*\)/i.test(sql)) {
    issues.push("missing CREATE FUNCTION ()");
  }
  for (const role of ["anon", "authenticated", "service_role"]) {
    if (!new RegExp(`GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.get_home_featured_hero\\s*\\(\\s*\\)\\s+TO\\s+${role}`, "i").test(sql)) {
      issues.push(`missing GRANT to ${role}`);
    }
  }
  if (!/^BEGIN;/m.test(sql) || !/^COMMIT;/m.test(sql)) {
    issues.push("missing BEGIN/COMMIT");
  }

  try {
    assertNoTempOrPlpgsql(body, label);
  } catch (e) {
    issues.push(String(e.message || e));
  }

  // Header comments may mention the old plpgsql failure — only flag DDL.
  if (/CREATE\s+FUNCTION[\s\S]*?\bLANGUAGE\s+plpgsql\b/i.test(sql)) {
    issues.push("CREATE FUNCTION uses LANGUAGE plpgsql");
  }
  if (!/\bCREATE\s+FUNCTION[\s\S]*?\bLANGUAGE\s+sql\b/i.test(sql)) {
    issues.push("CREATE FUNCTION missing LANGUAGE sql");
  }
  if (returns.length !== finalAliases.length) {
    issues.push(
      `RETURNS TABLE (${returns.length}) != final SELECT (${finalAliases.length})`,
    );
  }
  for (let i = 0; i < Math.min(returns.length, finalAliases.length); i++) {
    if (returns[i].name !== finalAliases[i]) {
      issues.push(
        `col ${i}: RETURNS ${returns[i].name} != final ${finalAliases[i]}`,
      );
    }
  }

  for (const cte of [
    "reaction_ranked",
    "rising_ranked",
    "newest_ranked",
    "updated_ranked",
  ]) {
    const { aliases, hasStar } = extractCteSelectAliases(body, cte);
    if (hasStar) {
      issues.push(`${cte} uses SELECT *`);
      continue;
    }
    if (aliases.length !== CANONICAL_SLOT_COLS.length) {
      issues.push(
        `${cte} col count ${aliases.length} != canonical ${CANONICAL_SLOT_COLS.length}`,
      );
    }
    for (let i = 0; i < CANONICAL_SLOT_COLS.length; i++) {
      if (aliases[i] !== CANONICAL_SLOT_COLS[i]) {
        issues.push(
          `${cte}[${i}] ${aliases[i] || "missing"} != ${CANONICAL_SLOT_COLS[i]}`,
        );
      }
    }
  }

  for (const cte of [
    "reaction_pick",
    "rising_pick",
    "newest_pick",
    "updated_pick",
  ]) {
    const { aliases, hasStar } = extractCteSelectAliases(body, cte);
    if (hasStar) {
      issues.push(`${cte} uses SELECT * (unsafe with CROSS JOIN params)`);
      continue;
    }
    if (aliases.join(",") !== CANONICAL_SLOT_COLS.join(",")) {
      issues.push(`${cte} aliases mismatch canonical slot`);
    }
  }

  const branches = extractPickedUnionBranches(body);
  if (branches.length !== 4) {
    issues.push(`picked UNION branches = ${branches.length}, expected 4`);
  }
  const expectedPicked = [...PICKED_PREFIX, ...CANONICAL_SLOT_COLS];
  for (const b of branches) {
    if (b.hasStar) {
      issues.push(`picked branch ${b.index} uses *`);
      continue;
    }
    if (b.aliases.length !== expectedPicked.length) {
      issues.push(
        `picked branch ${b.index} count ${b.aliases.length} != ${expectedPicked.length}`,
      );
    }
    for (let i = 0; i < expectedPicked.length; i++) {
      if (b.aliases[i] !== expectedPicked[i]) {
        issues.push(
          `picked[${b.index}][${i}] ${b.aliases[i] || "missing"} != ${expectedPicked[i]}`,
        );
      }
    }
  }
  if (branches.length >= 2) {
    const a = branches[0].aliases.join("|");
    for (let i = 1; i < branches.length; i++) {
      const b = branches[i].aliases.join("|");
      if (a !== b) {
        issues.push(`picked branch 0 vs ${i} alias sequence differs`);
      }
    }
  }

  return {
    label,
    path,
    ok: issues.length === 0,
    issues,
    returnsCount: returns.length,
    returnsNames: returns.map((r) => r.name),
    finalAliases,
    canonicalSlotCols: CANONICAL_SLOT_COLS,
    pickedExpected: expectedPicked,
    body,
  };
}

const r66 = verifyFile(PATH_066, "066");
const r67 = verifyFile(PATH_067, "067");
const bodyEqual =
  r66.body.replace(/\r\n/g, "\n") === r67.body.replace(/\r\n/g, "\n");
const allOk = r66.ok && r67.ok && bodyEqual;

const report = {
  ok: allOk,
  bodyEqual,
  returnsTable: r67.returnsNames,
  canonicalSlotCols: CANONICAL_SLOT_COLS,
  pickedUnionCols: r67.pickedExpected,
  results: [
    { label: r66.label, ok: r66.ok, issues: r66.issues },
    { label: r67.label, ok: r67.ok, issues: r67.issues },
  ],
};

console.log(JSON.stringify(report, null, 2));
process.exit(allOk ? 0 : 1);
