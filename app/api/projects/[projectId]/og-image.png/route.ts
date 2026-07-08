import { handleProjectOgImageGet } from "@/lib/project-og-image-route";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/** Primary lazy OGP path (rewritten from `.png` URL). */
export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  return handleProjectOgImageGet(projectId);
}
