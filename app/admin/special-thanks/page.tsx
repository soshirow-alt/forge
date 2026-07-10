import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SpecialThanksAdminPage } from "@/components/special-thanks-admin-page";
import { buildLoginUrlWithReturn } from "@/lib/login-return-url";
import {
  SPECIAL_THANKS_ADMIN_PATH,
  type SpecialThanksEntry,
} from "@/lib/special-thanks";
import { isForgeAdmin } from "@/lib/supabase/forge-admin";
import { createClient } from "@/lib/supabase/server";
import { listAllSpecialThanksForAdmin } from "@/lib/supabase/special-thanks-db";

export const metadata: Metadata = {
  title: "Special Thanks 管理 | Forge",
  robots: { index: false, follow: false },
};

export default async function SpecialThanksAdminRoutePage() {
  const supabase = await createClient();
  if (!supabase) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginUrlWithReturn(SPECIAL_THANKS_ADMIN_PATH));
  }

  const admin = await isForgeAdmin(supabase);
  if (!admin) {
    notFound();
  }

  let entries: SpecialThanksEntry[] = [];
  try {
    entries = await listAllSpecialThanksForAdmin(supabase);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "special_thanks_table_missing"
    ) {
      entries = [];
    } else {
      throw error;
    }
  }

  return <SpecialThanksAdminPage initialEntries={entries} userId={user.id} />;
}
