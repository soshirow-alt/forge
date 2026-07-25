import { ExplorePrototypeHomePage } from "@/components/explore-prototype/explore-prototype-home-page";

export default async function ExplorePrototypeIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  return <ExplorePrototypeHomePage query={sp.q ?? ""} />;
}
