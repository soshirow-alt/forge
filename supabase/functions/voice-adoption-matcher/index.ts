/**
 * voice-adoption-matcher — Edge entry (production target).
 *
 * Staging uses Next.js POST /api/voice-adoption/run with service role instead.
 * Live OpenAI on Edge requires explicit deploy Run + OPENAI_API_KEY.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ADOPTION_THRESHOLD = 0.82;
const INDIRECT_THRESHOLD = 0.88;

type MatcherRequest = {
  devlogId?: string;
  projectId?: string;
  mode?: "fixture" | "live";
};

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const envMode = Deno.env.get("VOICE_ADOPTION_MATCHER_MODE");
  const matcherMode =
    envMode ??
    (Deno.env.get("NEXT_PUBLIC_VOICE_ADOPTION_FIXTURE") === "true"
      ? "fixture"
      : "live");

  let body: MatcherRequest = {};
  try {
    body = (await request.json()) as MatcherRequest;
  } catch {
    body = {};
  }

  const mode = body.mode ?? matcherMode;

  if (mode === "live") {
    return new Response(
      JSON.stringify({
        error:
          "Live Edge matcher not deployed. Use Next.js POST /api/voice-adoption/run for staging.",
        status: "skipped",
        stagingPath: "/api/voice-adoption/run",
      }),
      { status: 501, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      status: "completed",
      mode: "fixture",
      devlogId: body.devlogId ?? "fixture-devlog-001",
      projectId: body.projectId ?? "emberfall",
      adoptedCount: 5,
      skippedBelowThreshold: 5,
      threshold: ADOPTION_THRESHOLD,
      indirectThreshold: INDIRECT_THRESHOLD,
      message:
        "Fixture stub only. Staging: Next API + npm run verify:voice-adoption.",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
