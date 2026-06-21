"use client";

import { useSyncExternalStore } from "react";
import { isPreviewV0Deployment } from "@/lib/preview-v0";

function subscribe(): () => void {
  return () => {};
}

function getClientSnapshot(): boolean {
  return isPreviewV0Deployment();
}

function getServerSnapshot(): boolean {
  return isPreviewV0Deployment();
}

/** Preview v0 デプロイか（クライアントでは hostname でも判定） */
export function usePreviewV0(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
