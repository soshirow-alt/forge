import { redirect } from "next/navigation";

export default async function MyProjectsRoute({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const sp = await searchParams;

  if (sp.focus) {
    redirect(`/projects/${encodeURIComponent(sp.focus)}/studio`);
  }

  redirect("/studio/mypage");
}
