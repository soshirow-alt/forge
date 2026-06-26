/** v0 — 新規登録後の「開発者ページを作成しますか？」状態（localStorage） */

export type DeveloperPageChoice = "declined" | "accepted";

type StoredState = {
  choice: DeveloperPageChoice | null;
};

const STORAGE_PREFIX = "forge-v0-developer-onboarding";
const PENDING_REGISTRATION_KEY = "forge-v0-new-registration-pending";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

function readState(userId: string): StoredState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function writeState(userId: string, state: StoredState) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

/** 新規登録直後（メール確認前でも）— 次回ログイン時に userId へ引き継ぐ */
export function markNewRegistrationPending() {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(PENDING_REGISTRATION_KEY, "1");
}

/** ログイン済み user に新規登録フラグを引き継ぐ */
export function migratePendingRegistration(userId: string) {
  if (typeof window === "undefined") {
    return;
  }
  if (sessionStorage.getItem(PENDING_REGISTRATION_KEY) !== "1") {
    return;
  }
  sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
  if (!readState(userId)) {
    writeState(userId, { choice: null });
  }
}

export function initDeveloperOnboardingForUser(userId: string) {
  writeState(userId, { choice: null });
}

export function shouldPromptDeveloperPage(userId: string): boolean {
  const state = readState(userId);
  if (!state) {
    return false;
  }
  return state.choice !== "accepted";
}

export function acceptDeveloperPage(userId: string) {
  writeState(userId, { choice: "accepted" });
}

export function declineDeveloperPage(userId: string) {
  writeState(userId, { choice: "declined" });
}
