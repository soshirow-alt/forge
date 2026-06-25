import { CommunityHubPage } from "@/components/community-hub-page";
import { StudioShell } from "@/components/studio-shell";

export function StudioCommunityPage() {
  return (
    <StudioShell activeNav="community">
      <CommunityHubPage variant="developer" />
    </StudioShell>
  );
}
