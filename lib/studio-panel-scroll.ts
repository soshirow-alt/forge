/** Reset page + Studio side-panel scroll when opening an edit view. */
export function scrollStudioPanelToTop(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
  const bodies = document.querySelectorAll<HTMLElement>("[data-studio-panel-scroll-body]");
  bodies.forEach((element) => {
    element.scrollTop = 0;
  });
}
