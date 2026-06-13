const base = "https://forge-flame-gamma.vercel.app";
const html = await fetch(`${base}/login`).then((r) => r.text());
const chunks = [
  ...new Set(
    [...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]),
  ),
];

let supabaseUrl = "";
let anonKey = "";

for (const chunk of chunks) {
  const text = await fetch(`${base}${chunk}`).then((r) => r.text());
  if (!supabaseUrl) {
    const urlMatch = text.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
    if (urlMatch) supabaseUrl = urlMatch[0];
  }
  if (!anonKey) {
    const keyMatch = text.match(
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    );
    if (keyMatch) anonKey = keyMatch[0];
  }
}

console.log("URL_FOUND", Boolean(supabaseUrl));
console.log("KEY_FOUND", anonKey.length);

if (!supabaseUrl || !anonKey) process.exit(1);

console.log("SUPABASE_HOST", new URL(supabaseUrl).hostname);

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

for (const table of tables) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=0`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  console.log(
    `${table}: ${response.status === 200 ? "OK" : response.status + " " + (await response.text()).slice(0, 100)}`,
  );
}
