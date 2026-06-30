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

/** SSR/CSR 一致 — `shouldHideV0MockContent()` の client 直呼びを避ける */
export function useHideV0MockContent(): boolean {
  return useForgeDeploymentMode() === "production";
}

/** SSR/CSR で同じ値 — PlayerShell の Studio 切替が hydration 不一致にならない */
export function useStudioLoginHrefBypass(): boolean {
  return useForgeDeploymentMode() !== "production";
}
