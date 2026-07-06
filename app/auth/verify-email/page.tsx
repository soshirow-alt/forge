import { Suspense } from "react";
import { AuthVerifyEmailPage } from "@/components/auth-verify-email-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const params = await searchParams;
  const supabaseConfigured = hasSupabaseEnv();

  return (
    <Suspense>
      <AuthVerifyEmailPage
        supabaseConfigured={supabaseConfigured}
        returnParam={params.return ?? null}
      />
    </Suspense>
  );
}
