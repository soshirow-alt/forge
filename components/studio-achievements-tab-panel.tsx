"use client";

import { Trophy } from "lucide-react";
import { studioDeveloperSelfProfile } from "@/lib/studio-developer-profile-v0-mock-data";

export function StudioAchievementsTabPanel() {
  const earned = studioDeveloperSelfProfile.milestones.filter((item) => item.earned);
  const total = studioDeveloperSelfProfile.milestones.length;
  const percent = total > 0 ? Math.round((earned.length / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">実績</h1>
        <p className="mt-2 text-sm text-zinc-400">開発者としての到達記録です。</p>
      </header>

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
              <Trophy className="size-7" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-zinc-500">獲得済み</p>
              <p className="text-2xl font-bold text-white">
                {earned.length}{" "}
                <span className="text-lg font-normal text-zinc-500">/ {total}</span>
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            達成率 <span className="font-semibold text-violet-300">{percent}%</span>
          </p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">到達記録</h2>
        <ul className="mt-4 space-y-3">
          {studioDeveloperSelfProfile.milestones.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border px-4 py-3 ${
                item.earned
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "border-zinc-800/60 bg-zinc-950/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={`text-sm font-medium ${item.earned ? "text-zinc-200" : "text-zinc-500"}`}>
                  {item.label}
                </p>
                {item.earned ? (
                  <span className="text-xs text-zinc-500">{item.date}</span>
                ) : item.progress ? (
                  <span className="text-xs text-violet-300">
                    {item.progress.current} / {item.progress.target}
                  </span>
                ) : null}
              </div>
              {!item.earned && item.progress && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-violet-500/70"
                    style={{
                      width: `${Math.min(100, (item.progress.current / item.progress.target) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
