"use client";

import Link from "next/link";
import { useState } from "react";
import { PlayerShell } from "@/components/player-shell";
import { playerSettingsSections } from "@/lib/player-settings-v0-mock-data";

export function PlayerSettingsV0Page() {
  const [sections, setSections] = useState(playerSettingsSections);

  const toggleItem = (sectionId: string, itemId: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, enabled: !item.enabled } : item,
              ),
            },
      ),
    );
  };

  return (
    <PlayerShell activeNav="settings">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">設定</h1>
          <p className="mt-2 text-sm text-zinc-400">プレイヤー個人設定（preview mock）</p>
        </header>

        {sections.map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold text-white">{section.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{section.description}</p>
            <ul className="mt-5 divide-y divide-zinc-800/80">
              {section.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
                  </div>
                  {section.id === "account" ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600"
                    >
                      変更
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.enabled}
                      onClick={() => toggleItem(section.id, item.id)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        item.enabled ? "bg-violet-600" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                          item.enabled ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-center text-xs text-zinc-600">
          <Link href="/mypage/profile" className="text-violet-400 hover:text-violet-300">
            プロフィールに戻る
          </Link>
        </p>
      </div>
    </PlayerShell>
  );
}
