"use client";

import { useState } from "react";
import { V0SimpleModal } from "@/components/v0-simple-modal";
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

type AccountEdit = "email" | "password" | null;

export function ForgeSettingsForm({ context }: { context: "player" | "studio" }) {
  const [playerNotifications, setPlayerNotifications] = useState(forgeNotificationPlayerItems);
  const [studioNotifications, setStudioNotifications] = useState(forgeNotificationStudioItems);
  const [sections, setSections] = useState(forgeSettingsSections);
  const [accountEdit, setAccountEdit] = useState<AccountEdit>(null);
  const [emailDraft, setEmailDraft] = useState("shaneco@example.com");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

  function openAccountEdit(id: string) {
    setSaveMessage(null);
    if (id === "email") {
      const accountSection = sections.find((section) => section.id === "account");
      const emailItem =
        accountSection?.kind === "actions"
          ? accountSection.items.find((item) => item.id === "email")
          : undefined;
      setEmailDraft(emailItem?.description ?? emailDraft);
      setAccountEdit("email");
      return;
    }
    if (id === "password") {
      setPasswordDraft("");
      setPasswordConfirm("");
      setAccountEdit("password");
    }
  }

  function saveEmail() {
    const trimmed = emailDraft.trim();
    if (!trimmed.includes("@")) {
      setSaveMessage("有効なメールアドレスを入力してください。");
      return;
    }
    setSections((current) =>
      current.map((section) => {
        if (section.id !== "account" || section.kind !== "actions") {
          return section;
        }
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === "email" ? { ...item, description: trimmed } : item,
          ),
        };
      }),
    );
    setAccountEdit(null);
    setSaveMessage("メールアドレスを更新しました（preview mock）。");
  }

  function savePassword() {
    if (passwordDraft.length < 8) {
      setSaveMessage("パスワードは8文字以上にしてください。");
      return;
    }
    if (passwordDraft !== passwordConfirm) {
      setSaveMessage("確認用パスワードが一致しません。");
      return;
    }
    const today = new Date().toLocaleDateString("ja-JP");
    setSections((current) =>
      current.map((section) => {
        if (section.id !== "account" || section.kind !== "actions") {
          return section;
        }
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === "password" ? { ...item, description: `最終更新: ${today}` } : item,
          ),
        };
      }),
    );
    setAccountEdit(null);
    setSaveMessage("パスワードを更新しました（preview mock）。");
  }

  return (
    <div className="space-y-8">
      {accountEdit === "email" && (
        <V0SimpleModal title="メールアドレスを変更" onClose={() => setAccountEdit(null)}>
          <label className="block text-xs font-medium text-zinc-500" htmlFor="settings-email">
            新しいメールアドレス
          </label>
          <input
            id="settings-email"
            type="email"
            value={emailDraft}
            onChange={(event) => setEmailDraft(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
          />
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={saveEmail}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setAccountEdit(null)}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600"
            >
              キャンセル
            </button>
          </div>
        </V0SimpleModal>
      )}

      {accountEdit === "password" && (
        <V0SimpleModal title="パスワードを変更" onClose={() => setAccountEdit(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500" htmlFor="settings-password">
                新しいパスワード
              </label>
              <input
                id="settings-password"
                type="password"
                value={passwordDraft}
                onChange={(event) => setPasswordDraft(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-zinc-500"
                htmlFor="settings-password-confirm"
              >
                新しいパスワード（確認）
              </label>
              <input
                id="settings-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-200 focus:border-violet-500/40 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={savePassword}
              className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => setAccountEdit(null)}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-600"
            >
              キャンセル
            </button>
          </div>
        </V0SimpleModal>
      )}

      {saveMessage && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {saveMessage}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">通知</h2>
        <p className="mt-1 text-sm text-zinc-500">
          通知設定は共通です。Player 向けと Studio 向けをそれぞれ選べます。
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
            return section.id === "account" || section.id === "privacy";
          }
          return section.id === "account" || section.id === "studio-public";
        })
        .map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-white">{section.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
            <ul className="mt-5 divide-y divide-zinc-800/80">
              {section.kind === "actions"
                ? section.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAccountEdit(item.id)}
                        className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                      >
                        変更
                      </button>
                    </li>
                  ))
                : (section.items as SettingsToggleItem[]).map((item) => (
                    <ToggleRow
                      key={item.id}
                      item={item}
                      onToggle={() => toggleSectionItem(section.id, item.id)}
                    />
                  ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
