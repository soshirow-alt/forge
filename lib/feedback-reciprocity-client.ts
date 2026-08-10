/** Best-effort outbox kick after registered feedback INSERT succeeds. */
export async function scheduleFeedbackReciprocity(_projectId?: string): Promise<void> {
  try {
    await fetch("/api/feedback/reciprocity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } catch {
    // Feedback already saved; email kick must not surface as submit failure.
  }
}
