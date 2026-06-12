export type AuthProvider = "google" | "discord" | "guest";

export type User = {
  id: string;
  name: string;
  avatarInitial: string;
  provider: AuthProvider;
};

export const AUTH_STORAGE_KEY = "forge-user";

export function createUser(provider: AuthProvider): User {
  const id = `user-${Date.now()}`;

  switch (provider) {
    case "google":
      return { id, name: "Googleユーザー", avatarInitial: "G", provider };
    case "discord":
      return { id, name: "Discordユーザー", avatarInitial: "D", provider };
    case "guest":
      return { id, name: "ゲストユーザー", avatarInitial: "G", provider };
  }
}

export function loadUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const user = JSON.parse(stored) as User;
    if (!user.id) {
      const migrated = { ...user, id: `user-${Date.now()}` };
      saveUser(migrated);
      return migrated;
    }

    return user;
  } catch {
    return null;
  }
}

export function saveUser(user: User) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
