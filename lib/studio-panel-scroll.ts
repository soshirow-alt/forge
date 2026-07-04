/** Reset page scroll when opening a Studio side-panel edit view. */
export function scrollStudioPanelToTop(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}
