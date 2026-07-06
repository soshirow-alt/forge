/** Capture current scroll position and return a restorer (call after DOM updates). */
export function captureScrollPosition(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  return () => {
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    requestAnimationFrame(() => {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    });
  };
}
