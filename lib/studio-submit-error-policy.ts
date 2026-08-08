/** Submit page: only validation errors auto-clear when draft becomes valid. */
export function shouldAutoClearSubmitErrorOnDraftChange(
  source: "validation" | "save" | null,
): boolean {
  return source === "validation";
}
