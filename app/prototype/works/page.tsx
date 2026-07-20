import { redirect } from "next/navigation";
import {
  exploreCategoryHref,
  parseExploreCategoryQuery,
} from "@/lib/prototype/domain-expansion";

export const metadata = {
  title: "カテゴリ面へ移動 — Forge",
  robots: { index: false, follow: false },
};

/** Legacy prototype list → Explore category surface */
export default async function PrototypeWorksCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: raw } = await searchParams;
  const category = parseExploreCategoryQuery(raw) ?? "music";
  redirect(exploreCategoryHref(category));
}
