"use client";

import { createContext, useContext } from "react";
import type { ForgeDeploymentMode } from "@/lib/production-mode";
const ForgeDeploymentContext = createContext<ForgeDeploymentMode>("production");

export function ForgeDeploymentProvider({
  mode,
  children,
}: {
  mode: ForgeDeploymentMode;
  children: React.ReactNode;
}) {
  return (
    <ForgeDeploymentContext.Provider value={mode}>{children}</ForgeDeploymentContext.Provider>
  );
}

export function useForgeDeploymentMode(): ForgeDeploymentMode {
  return useContext(ForgeDeploymentContext);
}

/** SSR/CSR で同じ値 — PlayerShell の Studio 切替が hydration 不一致にならない */
export function useStudioLoginHrefBypass(): boolean {
  return useForgeDeploymentMode() !== "production";
}
