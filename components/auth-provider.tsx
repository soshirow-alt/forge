"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearUser,
  createUser,
  loadUser,
  saveUser,
  type AuthProvider,
  type User,
} from "@/lib/auth";
import { DEMO_USER } from "@/lib/demo-setup";

type AuthContextValue = {
  user: User | null;
  hydrated: boolean;
  login: (provider: AuthProvider) => void;
  loginDemoUser: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setHydrated(true);
  }, []);

  const login = useCallback((provider: AuthProvider) => {
    const nextUser = createUser(provider);
    saveUser(nextUser);
    setUser(nextUser);
  }, []);

  const loginDemoUser = useCallback(() => {
    saveUser(DEMO_USER);
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, hydrated, login, loginDemoUser, logout }),
    [user, hydrated, login, loginDemoUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
