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
import { mapSupabaseUser, type User } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const supabase = useMemo(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }

    return createClient();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setHydrated(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setHydrated(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setHydrated(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
  }, [supabase]);

  const value = useMemo(
    () => ({ user, hydrated, signIn, signUp, logout }),
    [user, hydrated, signIn, signUp, logout],
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
