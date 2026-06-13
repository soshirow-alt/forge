import fs from "node:fs";

const envText = fs.readFileSync(".env.vercel", "utf8");
const env = {};
for (const line of envText.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const index = line.indexOf("=");
  if (index === -1) continue;
  const key = line.slice(0, index);
  let value = line.slice(index + 1);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("MISSING_ENV");
  process.exit(1);
}

const tables = [
  "projects",
  "developer_profiles",
  "project_supports",
  "project_watches",
  "project_bookmarks",
  "project_plays",
  "project_feedback",
  "project_devlogs",
  "user_notifications",
];

console.log("SUPABASE_HOST", new URL(url).hostname);

for (const table of tables) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (response.status === 200) {
    console.log(`${table}: OK`);
    continue;
  }

  const body = await response.text();
  console.log(`${table}: ${response.status} ${body.slice(0, 160)}`);
}
