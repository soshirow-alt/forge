"use client";

import Image from "next/image";
import Link from "next/link";
import { StudioSectionHeader, StudioShell } from "@/components/studio-shell";
import { studioSelfProfile } from "@/lib/studio-profile-v0-mock-data";
import { studioProjectHref, studioProjects } from "@/lib/studio-home-v0-mock-data";

export function StudioProfilePage() {
  const profile = studioSelfProfile;

  return (
    <StudioShell activeNav="mypage">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
              <Image src={profile.avatar} alt="" fill className="object-cover" sizes="96px" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
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
          <StudioSectionHeader title="到達記録" />
          <ul className="mt-4 space-y-2">
            {profile.milestones.map((item) => (
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

        <section>
          <StudioSectionHeader title="代表作品" href="/studio/projects" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {studioProjects.map((project) => (
              <Link
                key={project.id}
                href={studioProjectHref(project.id)}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 hover:border-zinc-700"
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

        <section>
          <StudioSectionHeader title="フォロワー" />
          <ul className="mt-4 space-y-2">
            {profile.followers.map((follower) => (
              <li
                key={follower.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3"
              >
                <div className="relative size-10 overflow-hidden rounded-full bg-zinc-800">
                  <Image src={follower.avatar} alt="" fill className="object-cover" sizes="40px" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{follower.name}</p>
                  <p className="text-xs text-zinc-500">@{follower.handle}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </StudioShell>
  );
}
