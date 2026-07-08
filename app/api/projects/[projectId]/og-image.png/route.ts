import { handleProjectOgImageGet } from "@/lib/project-og-image-route";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/** Primary OGP card — 1200×630 PNG for X / social crawlers. */
export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  return handleProjectOgImageGet(projectId);
}
