"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { CommunityPost, CommunityReply } from "@/lib/community-v0-mock-data";
import { shouldHideV0MockContent } from "@/lib/production-mode";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  fetchCommunityPosts,
  insertCommunityPost,
  insertCommunityReply,
} from "@/lib/supabase/community-db";

const DEFAULT_AVATAR = "/images/landing/game-4.png";

function resolveAuthor(userId: string, currentUserId?: string, userName?: string) {
  if (currentUserId && userId === currentUserId) {
    return {
      name: userName ?? "あなた",
      handle: "you",
      avatar: DEFAULT_AVATAR,
    };
  }

  return {
    name: "メンバー",
    handle: `player_${userId.slice(0, 8)}`,
    avatar: DEFAULT_AVATAR,
  };
}

export function useCommunityBoard(
  communityId: string,
  mockPosts: CommunityPost[],
) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(mockPosts);
  const [loaded, setLoaded] = useState(false);

  const authorResolver = useCallback(
    (authorId: string) =>
      resolveAuthor(authorId, user?.id, user?.name ?? undefined),
    [user?.id, user?.name],
  );

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);

    const supabase = getOptionalSupabaseClient();
    if (!supabase || !communityId) {
      setPosts(shouldHideV0MockContent() ? [] : mockPosts);
      setLoaded(true);
      return;
    }

    void fetchCommunityPosts(supabase, communityId, authorResolver)
      .then((dbPosts) => {
        if (cancelled) {
          return;
        }
        setPosts(
          dbPosts.length > 0 || shouldHideV0MockContent() ? dbPosts : mockPosts,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPosts(shouldHideV0MockContent() ? [] : mockPosts);
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
  }, [communityId, mockPosts, authorResolver]);

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
