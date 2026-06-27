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
import { getEmailConfirmRedirectUrl, getOAuthRedirectUrl } from "@/lib/auth-redirect";
import { mapSupabaseUser, type User } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import type { Provider } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<boolean>;
  signInWithOAuth: (provider: Provider, nextPath?: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: User | null;
};

export function AuthProvider({
  children,
  initialUser = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
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

    let active = true;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) {
        return;
      }

      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setHydrated(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      // Defer to avoid blocking signInWithPassword on the auth lock.
      setTimeout(() => {
        if (!active) {
          return;
        }

        setUser(session?.user ? mapSupabaseUser(session.user) : null);
        setHydrated(true);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        setUser(mapSupabaseUser(data.user));
      }
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
          emailRedirectTo: getEmailConfirmRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      // Confirm email ON 時、登録済みメールは error なし + identities 空で返る（列挙防止）
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        throw new Error("User already registered");
      }

      if (data.session?.user) {
        setUser(mapSupabaseUser(data.session.user));
      }

      return Boolean(data.session);
    },
    [supabase],
  );

  const signInWithOAuth = useCallback(
    async (provider: Provider, nextPath?: string | null) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthRedirectUrl(nextPath),
        },
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        window.location.assign(data.url);
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
    () => ({ user, hydrated, signIn, signUp, signInWithOAuth, logout }),
    [user, hydrated, signIn, signUp, signInWithOAuth, logout],
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
