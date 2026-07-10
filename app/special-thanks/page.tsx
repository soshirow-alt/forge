import type { Metadata } from "next";
import { SpecialThanksPublicPage } from "@/components/special-thanks-public-page";
import { SPECIAL_THANKS_PUBLIC_INTRO } from "@/lib/special-thanks";
import { createClient } from "@/lib/supabase/server";
import { listPublishedSpecialThanks } from "@/lib/supabase/special-thanks-db";

export const metadata: Metadata = {
  title: "Special Thanks | Forge",
  description: SPECIAL_THANKS_PUBLIC_INTRO,
};

export default async function SpecialThanksPage() {
  const supabase = await createClient();
  const entries = supabase ? await listPublishedSpecialThanks(supabase) : [];

  return <SpecialThanksPublicPage entries={entries} />;
}
