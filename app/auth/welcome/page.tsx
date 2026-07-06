import { AuthWelcomePage } from "@/components/auth-welcome-page";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const params = await searchParams;

  return <AuthWelcomePage returnParam={params.return ?? null} />;
}
