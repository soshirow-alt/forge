"use client";

import Image from "next/image";
import Link from "next/link";
import { StudioSectionHeader, StudioShell } from "@/components/studio-shell";
import { studioSelfProfile } from "@/lib/studio-profile-v0-mock-data";
import { studioProjectHref, studioProjectsAll } from "@/lib/studio-projects-v0-mock-data";

export function StudioProfilePage() {
  const profile = studioSelfProfile;

  return (
    <StudioShell activeNav="mypage">
      <div className="mx-auto max-w-7xl">
        <div className="mt-2 flex flex-col gap-8 xl:flex-row">
          <div className="min-w-0 flex-1 space-y-8">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
                  <Image src={profile.avatar} alt="" fill className="object-cover" sizes="96px" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {profile.name}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500">@{profile.handle}</p>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-300">{profile.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-md border border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <StudioSectionHeader title="代表作品" href="/studio/projects" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {studioProjectsAll.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    href={studioProjectHref(project.id)}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 transition-colors hover:border-zinc-700"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                      <Image src={project.image} alt="" fill className="object-cover" sizes="56px" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{project.title}</p>
                      <p className="text-xs text-zinc-500">
                        {project.phase} · 見届け人 {project.witnessCount}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <StudioSectionHeader title="活動履歴" />
              <ul className="mt-4 space-y-2">
                {profile.activity.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm"
                  >
                    <span className="text-zinc-200">{item.label}</span>
                    <span className="text-zinc-500">{item.date}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="w-full shrink-0 space-y-6 xl:w-72">
            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
              <h2 className="text-sm font-semibold text-white">開発者サマリー</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">代表作品</span>
                  <span className="font-medium text-zinc-200">3</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">到達記録</span>
                  <span className="font-medium text-zinc-200">{profile.milestones.length}</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">活動履歴</span>
                  <span className="font-medium text-zinc-200">{profile.activity.length}</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
              <h2 className="text-sm font-semibold text-white">到達記録</h2>
              <ul className="mt-4 space-y-2">
                {profile.milestones.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-sm"
                  >
                    <p className="text-zinc-200">{item.label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.date}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5">
              <h2 className="text-sm font-semibold text-white">ショートカット</h2>
              <div className="mt-4 space-y-2">
                <Link
                  href="/studio/projects"
                  className="block rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  プロジェクト一覧
                </Link>
                <Link
                  href="/submit"
                  className="block rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  作品を投稿
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </StudioShell>
  );
}
