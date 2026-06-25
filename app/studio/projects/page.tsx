import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ tab?: string; q?: string }>;
};

export default async function StudioProjectsRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.tab) {
    qs.set("tab", params.tab);
  }
  if (params.q) {
    qs.set("q", params.q);
  }
  const suffix = qs.toString();
  redirect(suffix ? `/studio/mypage?${suffix}` : "/studio/mypage");
}
