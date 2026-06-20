import { redirect } from "next/navigation";

export default async function MyProjectsRoute({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ tab: "developer" });
  if (sp.focus) {
    params.set("focus", sp.focus);
  }
  redirect(`/mypage?${params.toString()}`);
}
