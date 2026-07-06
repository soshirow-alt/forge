/** Update the URL without triggering Next.js App Router navigation. */
export function replaceUrlWithoutNavigation(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.history.replaceState(window.history.state, "", url);
}
