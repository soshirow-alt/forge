export function invokeAdoptionMatcherAfterPublish(devlogId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  void fetch("/api/voice-adoption/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ devlogId }),
  }).catch((error) => {
    console.error("voice adoption matcher invoke failed", error);
  });
}
