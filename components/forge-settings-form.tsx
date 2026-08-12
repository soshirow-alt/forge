"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { AccountSettingsPanel } from "@/components/account-settings-panel";
import { XAccountLinkSection } from "@/components/x-account-link-section";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import {
  FORGE_LEGAL_CONTACT_EMAIL,
  PRIVACY_PATH,
  TERMS_PATH,
} from "@/lib/legal-routes";
import {
  PLAYER_SETTINGS_PATH,
  type SettingsSurfacePath,
} from "@/lib/settings-surface";
import { useUserSettings, type SettingsToggleItem } from "@/hooks/use-user-settings";
import {
  privacySettingsSection,
  studioPublicSettingsSection,
} from "@/lib/user-settings-definitions";

function SettingsHelpButton({ label, helpText }: { label: string; helpText: string }) {
  return (
    <button
      type="button"
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
      aria-label={`${label}の説明`}
      title={helpText}
    >
      <CircleHelp className="size-3.5" aria-hidden="true" />
    </button>
  );
}

function SettingsItemLabel({ item }: { item: SettingsToggleItem }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <p className="text-sm font-medium text-zinc-200">{item.label}</p>
      {item.helpText ? <SettingsHelpButton label={item.label} helpText={item.helpText} /> : null}
    </div>
  );
}

function ToggleSwitch({
  enabled,
  disabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? "forge-toggle-on" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
          enabled ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingsToggleRow({
  item,
  disabled,
  onToggle,
}: {
  item: SettingsToggleItem;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <SettingsItemLabel item={item} />
      <ToggleSwitch
        enabled={item.enabled}
        disabled={disabled}
        onToggle={onToggle}
        label={item.label}
      />
    </li>
  );
}

function SettingsItemList({
  items,
  disabled,
  onToggle,
}: {
  items: SettingsToggleItem[];
  disabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const visibleItems = items.filter((item) => !item.comingSoon);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-zinc-800/80">
      {visibleItems.map((item) => (
        <SettingsToggleRow
          key={item.id}
          item={item}
          disabled={disabled}
          onToggle={() => onToggle(item.id, !item.enabled)}
        />
      ))}
    </ul>
  );
}

function SettingsGroup({
  title,
  items,
  disabled,
  onToggle,
}: {
  title: string;
  items: SettingsToggleItem[];
  disabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const visibleItems = items.filter((item) => !item.comingSoon);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="forge-accent-link text-sm font-medium">{title}</h3>
      <div className="mt-3">
        <SettingsItemList items={visibleItems} disabled={disabled} onToggle={onToggle} />
      </div>
    </div>
  );
}

function AccountSettingsFallback() {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <p className="text-sm text-zinc-500">アカウント設定を読み込み中…</p>
    </section>
  );
}

function maskEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  return `${local.slice(0, 1)}***@${domain}`;
}

function PreferenceSettingsPanel() {
  const { user } = useAuth();
  const { getOwnedProjects } = useGames();
  const {
    loaded,
    saving,
    error,
    migrationMissing,
    playerNotifications,
    studioNotifications,
    emailMasterItem,
    emailCategoryItems,
    privacyItems,
    studioPublicItems,
    updateNotifyPlayer,
    updateNotifyStudio,
    updateNotifyEmail,
    updatePrivacy,
    updateStudioPublic,
  } = useUserSettings();
  const [toggleError, setToggleError] = useState<string | null>(null);

  const hasDeveloperProjects = Boolean(
    user && getOwnedProjects(user.id).length > 0,
  );
  const maskedEmail = maskEmail(user?.email);

  async function handleToggle(action: () => Promise<void>) {
    setToggleError(null);
    try {
      await action();
    } catch {
      setToggleError("設定の保存に失敗しました。時間をおいて再度お試しください。");
    }
  }

  if (!loaded) {
    return (
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <p className="text-sm text-zinc-500">設定を読み込み中…</p>
      </section>
    );
  }

  if (migrationMissing) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6">
        <p className="font-medium text-amber-200">設定の保存機能は Coming Soon です</p>
      </section>
    );
  }

  const disabled = saving;
  const visiblePrivacyItems = privacyItems.filter((item) => !item.comingSoon);
  const visibleStudioPublicItems = studioPublicItems.filter((item) => !item.comingSoon);
  const visiblePlayerNotifications = playerNotifications.filter((item) => !item.comingSoon);
  const visibleStudioNotifications = studioNotifications.filter((item) => !item.comingSoon);
  const hasNotificationGroups =
    visiblePlayerNotifications.length > 0 || visibleStudioNotifications.length > 0;
  const emailCategoriesDisabled = disabled || !emailMasterItem.enabled;

  return (
    <>
      {(error || toggleError) && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {toggleError ?? error}
        </p>
      )}

      <section
        id="email-notifications"
        className="scroll-mt-24 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold text-white">メール通知</h2>
        <p className="mt-1 text-sm text-zinc-400">
          重要なやり取りを登録メールアドレスに送ります
        </p>
        {maskedEmail ? (
          <p className="mt-2 text-xs text-zinc-500">送信先: {maskedEmail}</p>
        ) : null}

        <div className="mt-5 space-y-4">
          <SettingsToggleRow
            item={emailMasterItem}
            disabled={disabled}
            onToggle={() =>
              void handleToggle(() =>
                updateNotifyEmail("master", !emailMasterItem.enabled),
              )
            }
          />
          <div className="border-t border-zinc-800/80 pt-4">
            <SettingsItemList
              items={emailCategoryItems}
              disabled={emailCategoriesDisabled}
              onToggle={(id, enabled) =>
                void handleToggle(() =>
                  updateNotifyEmail(
                    id as
                      | "messages_collab"
                      | "usage_relation"
                      | "feedback_reciprocity",
                    enabled,
                  ),
                )
              }
            />
          </div>
        </div>
      </section>

      {hasNotificationGroups ? (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">アプリ内通知</h2>

          <div className="mt-5 space-y-6">
            {visiblePlayerNotifications.length > 0 ? (
              <SettingsGroup
                title="作品・フォロー"
                items={visiblePlayerNotifications}
                disabled={disabled}
                onToggle={(id, enabled) =>
                  void handleToggle(() => updateNotifyPlayer(id, enabled))
                }
              />
            ) : null}

            {visibleStudioNotifications.length > 0 ? (
              <div
                className={
                  visiblePlayerNotifications.length > 0
                    ? "border-t border-zinc-800/80 pt-6"
                    : undefined
                }
              >
                <SettingsGroup
                  title="クリエイター向け"
                  items={visibleStudioNotifications}
                  disabled={disabled}
                  onToggle={(id, enabled) =>
                    void handleToggle(() => updateNotifyStudio(id, enabled))
                  }
                />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {visiblePrivacyItems.length > 0 ? (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">
            {privacySettingsSection.title}
          </h2>
          <div className="mt-5">
            <SettingsItemList
              items={visiblePrivacyItems}
              disabled={disabled}
              onToggle={(id, enabled) =>
                void handleToggle(() => updatePrivacy(id, enabled))
              }
            />
          </div>
        </section>
      ) : null}

      {visibleStudioPublicItems.length > 0 ? (
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-white">
            {studioPublicSettingsSection.title}
          </h2>
          {!hasDeveloperProjects ? (
            <p className="mt-2 text-xs text-zinc-500">
              作品を投稿すると、クリエイタープロフィールの公開を切り替えられます。
            </p>
          ) : null}
          <div className="mt-5">
            <SettingsItemList
              items={visibleStudioPublicItems}
              disabled={disabled || !hasDeveloperProjects}
              onToggle={(id, enabled) =>
                void handleToggle(() => updateStudioPublic(id, enabled))
              }
            />
          </div>
        </section>
      ) : null}
    </>
  );
}

function SettingsLegalLinks() {
  return (
    <nav
      aria-label="規約・お問い合わせ"
      className="border-t border-zinc-800/80 pt-6 text-center text-xs text-zinc-500"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href={TERMS_PATH} className="transition-colors hover:text-zinc-300">
          利用規約
        </Link>
        <Link href={PRIVACY_PATH} className="transition-colors hover:text-zinc-300">
          プライバシーポリシー
        </Link>
        <a
          href={`mailto:${FORGE_LEGAL_CONTACT_EMAIL}`}
          className="transition-colors hover:text-zinc-300"
        >
          お問い合わせ
        </a>
      </div>
    </nav>
  );
}

/** Canonical settings form — same surface for Player and Studio entry points. */
export function ForgeSettingsForm({
  settingsPath = PLAYER_SETTINGS_PATH,
}: {
  settingsPath?: SettingsSurfacePath;
}) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<AccountSettingsFallback />}>
        <AccountSettingsPanel
          section="credentials"
          settingsPath={settingsPath}
        />
      </Suspense>

      <Suspense fallback={<AccountSettingsFallback />}>
        <XAccountLinkSection settingsPath={settingsPath} />
      </Suspense>

      <PreferenceSettingsPanel />

      <Suspense fallback={null}>
        <AccountSettingsPanel
          section="deletion"
          settingsPath={settingsPath}
        />
      </Suspense>

      <SettingsLegalLinks />
    </div>
  );
}
