const STORAGE_KEY = "forge-modify-game-modal-dismissed";

export function isModifyGameModalDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setModifyGameModalDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (dismissed) {
      localStorage.setItem(STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}
