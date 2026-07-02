"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Heart,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/legal-routes";

export const authInputClassName =
  "mt-2 w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40";

export const authPrimaryButtonClassName =
  "w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const authSecondaryButtonClassName =
  "block w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3.5 text-center text-base font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/80";

/** @deprecated Prefer uncontrolled auth fields or server actions. Kept for settings forms. */
export function useAuthAutofillUnlock() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setUnlocked(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function unlock() {
    setUnlocked(true);
  }

  function onFocus(event: FocusEvent<HTMLInputElement>) {
    unlock();
    event.currentTarget.removeAttribute("readonly");
  }

  return {
    readOnly: !unlocked,
    onFocus,
  };
}

export function handleAuthFormEnterKey(event: KeyboardEvent<HTMLFormElement>) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.type === "checkbox" || target.type === "radio") {
    return;
  }

  event.preventDefault();
  event.currentTarget.requestSubmit();
}

export function AuthHeader({ active }: { active: "login" | "register" }) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-white/90 text-zinc-950">
          <Flame className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight text-white">Forge</span>
      </Link>
      <nav className="flex items-center gap-3">
        {active === "login" ? (
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-90"
          >
            新規登録
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            ログイン
          </Link>
        )}
      </nav>
    </header>
  );
}

export function AuthFooter() {
  return (
    <footer className="flex flex-col gap-3 border-t border-zinc-800/80 px-6 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between lg:px-10">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href={TERMS_PATH} className="transition-colors hover:text-zinc-300">
          利用規約
        </Link>
        <Link href={PRIVACY_PATH} className="transition-colors hover:text-zinc-300">
          プライバシーポリシー
        </Link>
      </div>
      <p>© 2026 Forge. All rights reserved.</p>
    </footer>
  );
}

const loginValues = [
  {
    icon: MessageSquare,
    iconClass: "bg-violet-500/20 text-violet-300",
    title: "フィードバックする",
    body: "プレイして、開発にフィードバックしよう",
  },
  {
    icon: TrendingUp,
    iconClass: "bg-emerald-500/20 text-emerald-300",
    title: "ゲームが育つ",
    body: "あなたのフィードバックで、ゲームが進化する",
  },
  {
    icon: Gamepad2,
    iconClass: "bg-amber-500/20 text-amber-300",
    title: "見届ける",
    body: "リリースまで、一緒に見届けよう",
  },
  {
    icon: Users,
    iconClass: "bg-rose-500/20 text-rose-300",
    title: "つながりが生まれる",
    body: "開発者とプレイヤーが出会い、最高の体験をつくる",
  },
] as const;

const registerValues = [
  {
    icon: MessageSquare,
    iconClass: "bg-violet-500/20 text-violet-300",
    title: "プレイして、フィードバックする",
    body: "あなたのフィードバックがゲームを進化させます。",
  },
  {
    icon: TrendingUp,
    iconClass: "bg-emerald-500/20 text-emerald-300",
    title: "ゲームが育つ瞬間を見届ける",
    body: "開発の過程から、作品の成長を見守れます。",
  },
  {
    icon: Users,
    iconClass: "bg-amber-500/20 text-amber-300",
    title: "開発者とつながる",
    body: "開発者とプレイヤーが一緒に、最高の体験をつくります。",
  },
  {
    icon: Heart,
    iconClass: "bg-rose-500/20 text-rose-300",
    title: "一緒に、最高のゲームをつくる",
    body: "あなたの参加が、次の名作を生み出します。",
  },
] as const;

export function AuthHeroPanel({ variant }: { variant: "login" | "register" }) {
  const values = variant === "login" ? loginValues : registerValues;

  return (
    <div className="relative hidden min-h-full overflow-hidden bg-zinc-950 lg:flex lg:flex-1">
      <Image
        src="/images/landing/hero-bg.png"
        alt=""
        fill
        className="object-cover opacity-60"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/70 via-zinc-950/50 to-zinc-950/90" />
      <div className="relative z-10 flex flex-col justify-center px-10 py-16 xl:px-14">
        {variant === "login" ? (
          <>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              完成前のゲームと、
              <br />
              プレイヤーを
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                つなぐ
              </span>
              場所。
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-300">
              Forgeは、インディーゲームの成長を支える
              <br />
              コミュニティプラットフォームです。
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              あなたの作品が、
              <br />
              誰かの
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                冒険
              </span>
              になる。
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-300">
              Forgeは、インディーゲームの成長を支える
              <br />
              コミュニティプラットフォームです。
            </p>
          </>
        )}
        <ul className="mt-10 space-y-5">
          {values.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
              >
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-0.5 text-sm text-zinc-400">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AuthPageShell({
  active,
  children,
}: {
  active: "login" | "register";
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <AuthHeader active={active} />
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 lg:max-w-xl lg:px-10 xl:max-w-2xl xl:px-14">
          {children}
        </div>
        <AuthHeroPanel variant={active} />
      </div>
      <AuthFooter />
    </div>
  );
}

export function PasswordInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  readOnly,
  onFocus,
}: {
  id: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
  readOnly?: boolean;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
}) {
  const [visible, setVisible] = useState(false);
  const controlled = value !== undefined;
  const uncontrolledProps =
    !controlled && defaultValue !== undefined ? { defaultValue } : {};

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onFocus={onFocus}
        {...(controlled
          ? { value, onChange: (event) => onChange?.(event.target.value) }
          : uncontrolledProps)}
        className={`${authInputClassName} pr-12`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 transition-colors hover:text-zinc-300"
        aria-label={visible ? "パスワードを隠す" : "パスワードを表示"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function OAuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-zinc-950 px-3 text-zinc-500">または</span>
      </div>
    </div>
  );
}

export function OAuthComingSoonSection({
  description = "Google / Discord / GitHub ログインは Coming Soon です。メールアドレスをご利用ください。",
}: {
  description?: string;
}) {
  return (
    <>
      <OAuthDivider />
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-5 text-center">
        <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
          Coming Soon
        </span>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">{description}</p>
      </div>
    </>
  );
}

export type OAuthProviderId = "google" | "discord" | "github";

export function OAuthButtons({
  mode,
  disabled = false,
  loadingProvider = null,
  onOAuth,
}: {
  mode: "login" | "register";
  disabled?: boolean;
  loadingProvider?: OAuthProviderId | null;
  onOAuth: (provider: OAuthProviderId) => void | Promise<void>;
}) {
  const verb = mode === "login" ? "続ける" : "登録";
  const providers: ReadonlyArray<{ id: OAuthProviderId; label: string }> = [
    { id: "google", label: `Googleで${verb}` },
    { id: "discord", label: `Discordで${verb}` },
    { id: "github", label: `GitHubで${verb}` },
  ];

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const isLoading = loadingProvider === provider.id;
        const isBusy = disabled || loadingProvider !== null;

        return (
          <button
            key={provider.id}
            type="button"
            disabled={isBusy}
            onClick={() => void onOAuth(provider.id)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "リダイレクト中..." : provider.label}
          </button>
        );
      })}
    </div>
  );
}
