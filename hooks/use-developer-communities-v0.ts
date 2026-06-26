"use client";

import { useSyncExternalStore } from "react";
import {
  getDeveloperCommunitiesServerSnapshot,
  getOpenedDeveloperCommunities,
  subscribeDeveloperCommunities,
  type DeveloperCommunityProfile,
} from "@/lib/developer-community-v0-store";

function getSnapshot(): DeveloperCommunityProfile[] {
  return getOpenedDeveloperCommunities();
}

function getServerSnapshot(): DeveloperCommunityProfile[] {
  return getDeveloperCommunitiesServerSnapshot();
}

export function useDeveloperCommunitiesV0() {
  const opened = useSyncExternalStore(
    subscribeDeveloperCommunities,
    getSnapshot,
    getServerSnapshot,
  );

  return { opened };
}
