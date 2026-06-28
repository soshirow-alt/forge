"use client";

import { Suspense, useState } from "react";
import { AccountSettingsPanel } from "@/components/account-settings-panel";
import {
  forgeNotificationPlayerItems,
  forgeNotificationStudioItems,
  forgeSettingsSections,
  type SettingsToggleItem,
} from "@/lib/forge-settings-v0-mock-data";

function ToggleSwitch({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
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
  onToggle,
}: {
  item: SettingsToggleItem;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-zinc-200">{item.label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
      </div>
      <ToggleSwitch enabled={item.enabled} onToggle={onToggle} label={item.label} />
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

export function ForgeSettingsForm({ context }: { context: "player" | "studio" }) {
  const [playerNotifications, setPlayerNotifications] = useState(forgeNotificationPlayerItems);
  const [studioNotifications, setStudioNotifications] = useState(forgeNotificationStudioItems);
  const [sections, setSections] = useState(forgeSettingsSections);

  function togglePlayerNotification(id: string) {
    setPlayerNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
  }

  function toggleStudioNotification(id: string) {
    setStudioNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
  }

  function toggleSectionItem(sectionId: string, itemId: string) {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId || section.kind !== "toggles") {
          return section;
        }
        return {
          ...section,
          items: (section.items as SettingsToggleItem[]).map((item) =>
            item.id === itemId ? { ...item, enabled: !item.enabled } : item,
          ),
        };
      }),
    );
  }

  return (
    <div className="space-y-8">
      <Suspense fallback={<AccountSettingsFallback />}>
        <AccountSettingsPanel section="credentials" />
      </Suspense>

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">通知</h2>
        <p className="mt-1 text-sm text-zinc-500">
          通知設定は共通です。Player 向けと Studio 向けをそれぞれ選べます（preview mock）。
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
                  onToggle={() => togglePlayerNotification(item.id)}
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
                  onToggle={() => toggleStudioNotification(item.id)}
                />
              ))}
            </ul>
          </div>
        </div>
      </section>

      {sections
        .filter((section) => {
          if (context === "player") {
            return section.id === "privacy";
          }
          return section.id === "studio-public";
        })
        .map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-white">{section.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
            <ul className="mt-5 divide-y divide-zinc-800/80">
              {(section.items as SettingsToggleItem[]).map((item) => (
                <ToggleRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleSectionItem(section.id, item.id)}
                />
              ))}
            </ul>
          </section>
        ))}

      <Suspense fallback={null}>
        <AccountSettingsPanel section="deletion" />
      </Suspense>
    </div>
  );
}
