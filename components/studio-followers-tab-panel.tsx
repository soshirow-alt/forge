"use client";

import { DeveloperListCard } from "@/components/developer-list-card";
import { developerProfileHref } from "@/lib/developer-search-v0-mock-data";
import {
  STUDIO_FOLLOWER_COUNT,
  studioFollowersMock,
} from "@/lib/studio-followers-v0-mock-data";

export function StudioFollowersTabPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">フォロワー</h2>
        <p className="mt-1 text-sm text-zinc-500">
          あなたをフォローしている {STUDIO_FOLLOWER_COUNT} 人（開発者を探すと同じカード表示）
        </p>
      </div>
      <ul className="space-y-4">
        {studioFollowersMock.map((dev) => (
          <li key={dev.id}>
            <DeveloperListCard
              dev={dev}
              showFollowButton={false}
              href={developerProfileHref(dev.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
