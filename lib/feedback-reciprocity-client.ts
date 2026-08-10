/** Best-effort reciprocity side-effect after registered feedback succeeds. */
export async function scheduleFeedbackReciprocity(projectId: string): Promise<void> {
  try {
    await fetch("/api/feedback/reciprocity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
  } catch {
    // Feedback already saved; reciprocity/email must not surface as submit failure.
  }
}
