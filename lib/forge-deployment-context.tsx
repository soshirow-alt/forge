"use client";

import { createContext, useContext } from "react";
import type { ForgeDeploymentMode } from "@/lib/production-mode";

type ForgeDeploymentContextValue = {
  mode: ForgeDeploymentMode;
  /** Server-resolved Preview routing flag for future `/home` chrome. */
  serveFutureDiscoveryHome: boolean;
};

const ForgeDeploymentContext = createContext<ForgeDeploymentContextValue>({
  mode: "production",
  serveFutureDiscoveryHome: false,
});

export function ForgeDeploymentProvider({
  mode,
  serveFutureDiscoveryHome,
  children,
}: {
  mode: ForgeDeploymentMode;
  serveFutureDiscoveryHome: boolean;
  children: React.ReactNode;
}) {
  return (
    <ForgeDeploymentContext.Provider
      value={{ mode, serveFutureDiscoveryHome }}
    >
      {children}
    </ForgeDeploymentContext.Provider>
  );
}

export function useForgeDeploymentMode(): ForgeDeploymentMode {
  return useContext(ForgeDeploymentContext).mode;
}

/** SSR/CSR 一致 — future `/home` chrome（カテゴリselect）用 */
export function useServeFutureDiscoveryHome(): boolean {
  return useContext(ForgeDeploymentContext).serveFutureDiscoveryHome;
}

/** SSR/CSR 一致 — `shouldHideV0MockContent()` の client 直呼びを避ける */
export function useHideV0MockContent(): boolean {
  return useForgeDeploymentMode() === "production";
}

/** SSR/CSR で同じ値 — PlayerShell の Studio 切替が hydration 不一致にならない */
export function useStudioLoginHrefBypass(): boolean {
  return useForgeDeploymentMode() !== "production";
}
