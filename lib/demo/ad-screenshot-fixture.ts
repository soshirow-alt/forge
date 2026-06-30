import {
  studioProjectsAll,
  type StudioProjectCard,
} from "@/lib/studio-projects-v0-mock-data";

/** `/demo/ad-screenshot` 専用 — 新着 FB ありの作品を優先した mock サブセット */
export function adScreenshotStudioProjects(): StudioProjectCard[] {
  const prioritized = ["hoshino-kioku", "seito-no-tabiji", "roshin-no-zanko"];
  const byId = new Map(studioProjectsAll.map((project) => [project.id, project]));
  const picked = prioritized
    .map((id) => byId.get(id))
    .filter((project): project is StudioProjectCard => Boolean(project));
  if (picked.length >= 3) {
    return picked;
  }
  return studioProjectsAll.slice(0, 3);
}
