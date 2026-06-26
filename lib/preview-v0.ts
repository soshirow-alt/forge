/**
 * Preview v0 helpers — preview/landing-01 branch.
 * Core mode detection: `lib/production-mode.ts` (REL-0-00).
 */

export {
  getForgeDeploymentMode,
  isPreviewV0Deployment,
  isProductionReleaseMode,
  shouldHideV0MockContent,
  shouldRedirectRootToDiscoveryHome,
  type ForgeDeploymentMode,
} from "@/lib/production-mode";

import { shouldBypassStudioLoginGate } from "@/lib/production-mode";

/** @deprecated Prefer `shouldBypassStudioLoginGate` — name kept for call sites. */
export function shouldBypassStudioLoginOnPreview(host?: string): boolean {
  return shouldBypassStudioLoginGate(host);
}
