import { Suspense } from "react";
import { RegisterPage } from "@/components/register-page";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const params = await searchParams;
  const supabaseConfigured = hasSupabaseEnv();

  return (
    <Suspense>
      <RegisterPage
        supabaseConfigured={supabaseConfigured}
        returnParam={params.return ?? null}
      />
    </Suspense>
  );
}
