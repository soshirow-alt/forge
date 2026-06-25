import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PlayerShell } from "@/components/player-shell";
import { getPlayerPublicProfile } from "@/lib/community-player-profile-v0-mock-data";

export function PlayerPublicProfileV0Page({ handle }: { handle: string }) {
  const profile = getPlayerPublicProfile(handle);
  if (!profile) {
    notFound();
  }

  return (
    <PlayerShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/home" className="text-sm text-zinc-500 hover:text-violet-400">
          ← ホーム
        </Link>
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <ProfileAvatar src={profile.avatar} alt="" className="size-24" />
            <div className="min-w-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              <p className="mt-1 text-sm text-zinc-500">@{profile.handle}</p>
              <p className="mt-1 text-xs text-zinc-600">参加 {profile.joinedAt}</p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-zinc-300">{profile.bio}</p>
        </section>
      </div>
    </PlayerShell>
  );
}
