"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getEmailConfirmRedirectUrl, getOAuthRedirectUrl } from "@/lib/auth-redirect";
import { isRegisteredAppUser, mapSupabaseUser, type User } from "@/lib/auth";
import { clearEntryMode } from "@/lib/entry-mode";
import { isAnonymousSupabaseUser } from "@/lib/guest-auth";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Provider, User as SupabaseAuthUser } from "@supabase/supabase-js";
import { isXAuthEnabled } from "@/lib/x-auth";

type AuthContextValue = {
  user: User | null;
  /** @deprecated Prefer `authResolved` — kept for existing call sites. */
  hydrated: boolean;
  /** Client auth bootstrap finished; safe to gate on `user`. */
  authResolved: boolean;
  /** Email/OAuth registered account */
  isRegisteredUser: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<boolean>;
  signInWithOAuth: (provider: Provider, nextPath?: string | null) => Promise<void>;
  linkOAuthIdentity: (provider: Provider, nextPath?: string | null) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialUser?: User | null;
};

function applyAuthChangeEvent(
  event: AuthChangeEvent,
  sessionUser: SupabaseAuthUser | null | undefined,
  hadServerUser: boolean,
  setUser: (user: User | null) => void,
) {
  if (event === "SIGNED_OUT") {
    setUser(null);
    return;
  }

  if (sessionUser) {
    setUser(mapSupabaseUser(sessionUser));
    return;
  }

  // Keep server-hydrated user until client confirms a session or explicit sign-out.
  // Do not clear on transient null session events (TOKEN_REFRESHED, etc.).
  if (event === "INITIAL_SESSION" && hadServerUser) {
    return;
  }
}

export function AuthProvider({
  children,
  initialUser = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [authResolved, setAuthResolved] = useState(false);
  const hadServerUserRef = useRef(Boolean(initialUser));
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
      setAuthResolved(true);
      return;
    }

    let active = true;

    void supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!active) {
        return;
      }

      if (authUser && isAnonymousSupabaseUser(authUser)) {
        await supabase.auth.signOut();
        setUser(null);
        hadServerUserRef.current = false;
        setAuthResolved(true);
        return;
      }

      if (authUser) {
        setUser(mapSupabaseUser(authUser));
        hadServerUserRef.current = false;
        clearEntryMode();
      } else if (!hadServerUserRef.current) {
        setUser(null);
      }

      setAuthResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      // Defer to avoid blocking signInWithPassword on the auth lock.
      setTimeout(() => {
        if (!active) {
          return;
        }

        applyAuthChangeEvent(
          event,
          session?.user,
          hadServerUserRef.current,
          setUser,
        );

        if (session?.user && isAnonymousSupabaseUser(session.user)) {
          void supabase.auth.signOut();
          setUser(null);
        } else if (session?.user) {
          clearEntryMode();
        }

        if (session?.user || event === "SIGNED_OUT") {
          hadServerUserRef.current = false;
        }

        setAuthResolved(true);
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
        hadServerUserRef.current = false;
        clearEntryMode();
        setUser(mapSupabaseUser(data.user));
        setAuthResolved(true);
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
        hadServerUserRef.current = false;
        clearEntryMode();
        setUser(mapSupabaseUser(data.session.user));
        setAuthResolved(true);
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

      if (provider === "x" && !isXAuthEnabled()) {
        throw new Error("x_auth_disabled");
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

  const linkOAuthIdentity = useCallback(
    async (provider: Provider, nextPath?: string | null) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      if (provider === "x" && !isXAuthEnabled()) {
        throw new Error("x_auth_disabled");
      }

      const auth = supabase.auth as typeof supabase.auth & {
        linkIdentity?: (params: {
          provider: Provider;
          options?: { redirectTo?: string };
        }) => Promise<{
          data: { url?: string | null };
          error: { message?: string; code?: string } | null;
        }>;
      };

      if (typeof auth.linkIdentity !== "function") {
        throw new Error("Identity linking is not available in this client version.");
      }

      const { data, error } = await auth.linkIdentity({
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

    clearEntryMode();
    hadServerUserRef.current = false;
    setUser(null);
    setAuthResolved(true);
  }, [supabase]);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const trimmed = displayName.trim();
      if (!trimmed) {
        throw new Error("表示名を入力してください。");
      }

      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
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

  const isRegisteredUser = isRegisteredAppUser(user);

  const value = useMemo(
    () => ({
      user,
      hydrated: authResolved,
      authResolved,
      isRegisteredUser,
      signIn,
      signUp,
      signInWithOAuth,
      linkOAuthIdentity,
      updateDisplayName,
      logout,
    }),
    [
      user,
      authResolved,
      isRegisteredUser,
      signIn,
      signUp,
      signInWithOAuth,
      linkOAuthIdentity,
      updateDisplayName,
      logout,
    ],
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
