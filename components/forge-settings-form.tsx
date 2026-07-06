"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { AccountSettingsPanel } from "@/components/account-settings-panel";
import { XAccountLinkSection } from "@/components/x-account-link-section";
import { XAccountSettingsLinkSection } from "@/components/x-account-settings-link-section";
import {
  FORGE_LEGAL_CONTACT_EMAIL,
  PRIVACY_PATH,
  TERMS_PATH,
} from "@/lib/legal-routes";
import { useUserSettings, type SettingsToggleItem } from "@/hooks/use-user-settings";
import {
  privacySettingsSection,
  studioPublicSettingsSection,
} from "@/lib/user-settings-definitions";

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
        enabled ? "bg-violet-600" : "bg-zinc-700"
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

function ToggleRow({
  item,
  disabled,
  onToggle,
}: {
  item: SettingsToggleItem;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const rowDisabled = disabled || item.comingSoon;

  return (
    <li className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-zinc-200">{item.label}</p>
          {item.comingSoon ? (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
              近日対応
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
        {item.comingSoon ? (
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
            {item.comingSoonNote ??
              "近日対応予定（現在はまだ通知・公開範囲には反映されません）"}
          </p>
        ) : null}
      </div>
      <ToggleSwitch
        enabled={item.enabled}
        disabled={rowDisabled}
        onToggle={rowDisabled ? () => {} : onToggle}
        label={item.label}
      />
    </li>
  );
}

function AccountSettingsFallback() {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
      <p className="text-sm text-zinc-500">アカウント設定を読み込み中…</p>
    </section>
  );
}

function PreferenceSettingsPanel({ context }: { context: "player" | "studio" }) {
  const {
    loaded,
    saving,
    error,
    migrationMissing,
    playerNotifications,
    studioNotifications,
    privacyItems,
    studioPublicItems,
    updateNotifyPlayer,
    updateNotifyStudio,
    updatePrivacy,
    updateStudioPublic,
  } = useUserSettings();
  const [toggleError, setToggleError] = useState<string | null>(null);

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
        <p className="mt-2 text-sm leading-relaxed text-amber-100/80">
          通知・プライバシー設定の保存は Coming Soon です。
        </p>
      </section>
    );
  }

  const disabled = saving;

  return (
    <>
      {(error || toggleError) && (
        <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {toggleError ?? error}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">通知</h2>
        <p className="mt-1 text-sm text-zinc-500">
          通知設定はアカウントに保存されます。Player 向けと Studio 向けをそれぞれ選べます。
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-violet-200">Player 向けの通知</h3>
            <p className="mt-0.5 text-xs text-zinc-500">プレイヤーとして受け取るお知らせ</p>
            <ul className="mt-3 divide-y divide-zinc-800/80">
              {playerNotifications.map((item) => (
                <ToggleRow
                  key={item.id}
                  item={item}
                  disabled={disabled}
                  onToggle={() =>
                    void handleToggle(() => updateNotifyPlayer(item.id, !item.enabled))
                  }
                />
              ))}
            </ul>
          </div>

          <div className="border-t border-zinc-800/80 pt-6">
            <h3 className="text-sm font-medium text-violet-200">Studio 向けの通知</h3>
            <p className="mt-0.5 text-xs text-zinc-500">開発者として受け取るお知らせ</p>
            <ul className="mt-3 divide-y divide-zinc-800/80">
              {studioNotifications.map((item) => (
                <ToggleRow
                  key={item.id}
                  item={item}
                  disabled={disabled}
                  onToggle={() =>
                    void handleToggle(() => updateNotifyStudio(item.id, !item.enabled))
                  }
                />
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">
          {context === "player" ? privacySettingsSection.title : studioPublicSettingsSection.title}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {context === "player"
            ? privacySettingsSection.description
            : studioPublicSettingsSection.description}
        </p>
        <ul className="mt-5 divide-y divide-zinc-800/80">
          {(context === "player" ? privacyItems : studioPublicItems).map((item) => (
            <ToggleRow
              key={item.id}
              item={item}
              disabled={disabled}
              onToggle={() =>
                void handleToggle(() =>
                  context === "player"
                    ? updatePrivacy(item.id, !item.enabled)
                    : updateStudioPublic(item.id, !item.enabled),
                )
              }
            />
          ))}
        </ul>
      </section>
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

export function ForgeSettingsForm({ context }: { context: "player" | "studio" }) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<AccountSettingsFallback />}>
        <AccountSettingsPanel section="credentials" />
      </Suspense>

      {context === "player" ? (
        <Suspense fallback={<AccountSettingsFallback />}>
          <XAccountLinkSection />
        </Suspense>
      ) : (
        <XAccountSettingsLinkSection />
      )}

      <PreferenceSettingsPanel context={context} />

      <Suspense fallback={null}>
        <AccountSettingsPanel section="deletion" />
      </Suspense>

      <SettingsLegalLinks />
    </div>
  );
}
