import { StudioAccessLayout } from "@/components/studio-access-layout";
import { StudioShell } from "@/components/studio-shell";

/**
 * Persistent Studio chrome: sidebar/topbar stay mounted across /studio/**
 * navigations. Nested page-level StudioShell short-circuits via nest context.
 * loading.tsx only replaces main content inside this shell.
 */
export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioAccessLayout>
      <StudioShell>{children}</StudioShell>
    </StudioAccessLayout>
  );
}
