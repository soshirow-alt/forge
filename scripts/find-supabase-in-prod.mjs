const base = "https://forge-flame-gamma.vercel.app";
const html = await fetch(`${base}/login`).then((r) => r.text());
const chunks = [
  ...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g),
].map((m) => m[0]);

const urls = new Set();
for (const chunk of chunks) {
  const text = await fetch(`${base}${chunk}`).then((r) => r.text());
  for (const match of text.matchAll(/https:\/\/[a-z0-9]+\.supabase\.co/g)) {
    urls.add(match[0]);
  }
}

console.log("CHUNKS", chunks.length);
console.log("SUPABASE_URLS", [...urls]);
