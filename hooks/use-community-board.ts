"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useGames } from "@/components/games-provider";
import type { CommunityPost, CommunityReply } from "@/lib/community-v0-mock-data";
import { resolvePublicProfileDisplay } from "@/lib/public-profile-display";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchCommunityPosts,
  insertCommunityPost,
  insertCommunityReply,
} from "@/lib/supabase/community-db";

/** Stable empty list — inline `[]` in deps causes infinite refetch loops. */
export const EMPTY_COMMUNITY_POSTS: CommunityPost[] = [];

export function useCommunityBoard(
  communityId: string,
  mockPosts: CommunityPost[],
) {
  const { user } = useAuth();
  const { getDeveloperProfileByUserId } = useGames();
  const normalizedMockPosts =
    mockPosts.length === 0 ? EMPTY_COMMUNITY_POSTS : mockPosts;
  const [posts, setPosts] = useState<CommunityPost[]>(normalizedMockPosts);
  const [loaded, setLoaded] = useState(false);

  const authorResolver = useCallback(
    (authorId: string) => {
      const isSelf = Boolean(user?.id && authorId === user.id);
      const display = resolvePublicProfileDisplay(
        getDeveloperProfileByUserId(authorId),
        {
          userId: authorId,
          fallbackName: isSelf ? (user?.name ?? "あなた") : "メンバー",
        },
      );
      return {
        name: display.displayName,
        handle: isSelf ? "you" : display.handle,
        avatar: display.avatarSrc,
      };
    },
    [user?.id, user?.name, getDeveloperProfileByUserId],
  );

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);

    const supabase = getOptionalSupabaseClient();
    if (!supabase || !communityId) {
      setPosts(shouldHideV0MockContent() ? EMPTY_COMMUNITY_POSTS : normalizedMockPosts);
      setLoaded(true);
      return;
    }

    void fetchCommunityPosts(supabase, communityId, authorResolver)
      .then((dbPosts) => {
        if (cancelled) {
          return;
        }
        setPosts(
          dbPosts.length > 0 || shouldHideV0MockContent()
            ? dbPosts
            : normalizedMockPosts,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPosts(
            shouldHideV0MockContent() ? EMPTY_COMMUNITY_POSTS : normalizedMockPosts,
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [communityId, normalizedMockPosts, authorResolver]);

  const prependPost = useCallback((post: CommunityPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const appendReply = useCallback((postId: string, reply: CommunityReply) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, replies: [...(post.replies ?? []), reply] }
          : post,
      ),
    );
  }, []);

  const persistPost = useCallback(
    async (input: Parameters<typeof insertCommunityPost>[1]) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return null;
      }

      return insertCommunityPost(supabase, input);
    },
    [],
  );

  const persistReply = useCallback(
    async (input: Parameters<typeof insertCommunityReply>[1]) => {
      const supabase = getOptionalSupabaseClient();
      if (!supabase) {
        return null;
      }

      return insertCommunityReply(supabase, input);
    },
    [],
  );

  return {
    posts,
    loaded,
    prependPost,
    appendReply,
    persistPost,
    persistReply,
    authorResolver,
  };
}
