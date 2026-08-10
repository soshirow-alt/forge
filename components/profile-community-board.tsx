"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { communityIdFromUser } from "@/lib/developer-community-v0-store";
import { getOptionalSupabaseClient } from "@/lib/supabase/client";
import {
  ensureDeveloperCommunity,
  fetchDeveloperCommunityByOwner,
} from "@/lib/supabase/community-db";

type Post = {
  id: string;
  author_id: string;
  title: string | null;
  body: string;
  created_at: string;
  community_replies: {
    id: string;
    author_id: string;
    body: string;
    created_at: string;
  }[];
};

export function ProfileCommunityBoard({
  ownerId,
  ownerName,
  ownerHandle,
  isSelf,
}: {
  ownerId: string;
  ownerName: string;
  ownerHandle: string;
  isSelf: boolean;
}) {
  const { user } = useAuth();
  const { hydrated, isLoggedIn, goToLogin } = useRequireAuth();
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve()
      .then(async () => {
        const supabase = getOptionalSupabaseClient();
        if (!supabase) return;
        let community = await fetchDeveloperCommunityByOwner(supabase, ownerId);
        if (!community && isSelf) {
          const id = communityIdFromUser(ownerId, ownerHandle);
          await ensureDeveloperCommunity(supabase, {
            id,
            ownerId,
            name: `${ownerName}コミュニティ`,
            description: "",
            handle: ownerHandle,
          });
          community = await fetchDeveloperCommunityByOwner(supabase, ownerId);
        }
        if (!community || cancelled) return;
        setCommunityId(community.id);
        const { data, error: queryError } = await supabase
          .from("community_posts")
          .select(
            "id, author_id, title, body, created_at, community_replies(id, author_id, body, created_at)",
          )
          .eq("community_id", community.id)
          .order("created_at", { ascending: false });
        if (queryError) throw queryError;
        if (!cancelled) setPosts((data ?? []) as Post[]);
      })
      .catch(() => {
        if (!cancelled) setError("コミュニティを読み込めませんでした。");
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId, ownerHandle, ownerName, isSelf, reloadToken]);

  async function refreshBoard() {
    setReloadToken((token) => token + 1);
  }

  function requireRegisteredWrite(action: () => Promise<void>) {
    if (!hydrated) return;
    if (!isLoggedIn || !user) {
      goToLogin();
      return;
    }
    void action();
  }

  async function createPost() {
    if (!user || !communityId || !body.trim()) return;
    const supabase = getOptionalSupabaseClient();
    if (!supabase) return;
    const { error: insertError } = await supabase.from("community_posts").insert({
      community_id: communityId,
      author_id: user.id,
      author_role: "player",
      title: title.trim() || null,
      body: body.trim(),
      audience_label: "公開",
    });
    if (insertError) {
      setError("投稿できませんでした。");
      return;
    }
    setTitle("");
    setBody("");
    await refreshBoard();
  }

  async function reply(postId: string) {
    const replyBody = replyBodies[postId]?.trim();
    if (!user || !replyBody) return;
    const supabase = getOptionalSupabaseClient();
    if (!supabase) return;
    const { error: insertError } = await supabase.from("community_replies").insert({
      post_id: postId,
      author_id: user.id,
      body: replyBody,
    });
    if (insertError) {
      setError("返信できませんでした。");
      return;
    }
    setReplyBodies((current) => ({ ...current, [postId]: "" }));
    await refreshBoard();
  }

  async function remove(table: "community_posts" | "community_replies", id: string) {
    const supabase = getOptionalSupabaseClient();
    if (!supabase) return;
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
    if (deleteError) {
      setError("削除できませんでした。");
      return;
    }
    await refreshBoard();
  }

  return (
    <section className="space-y-4">
      {communityId ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="タイトル（任意）"
            maxLength={120}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="コミュニティに投稿"
            maxLength={4000}
            rows={4}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!body.trim()}
              onClick={() => requireRegisteredWrite(createPost)}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              投稿
            </button>
          </div>
        </div>
      ) : null}
      {posts.map((post) => (
        <article key={post.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="flex justify-between gap-3">
            <div>
              {post.title ? <h3 className="font-semibold text-white">{post.title}</h3> : null}
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-300">
                {post.body}
              </p>
            </div>
            {user && (user.id === post.author_id || isSelf) ? (
              <button
                type="button"
                onClick={() => void remove("community_posts", post.id)}
                className="text-xs text-zinc-500 hover:text-red-300"
              >
                削除
              </button>
            ) : null}
          </div>
          <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
            {post.community_replies.map((reply) => (
              <div key={reply.id} className="flex justify-between gap-3 rounded-lg bg-zinc-950/60 p-3">
                <p className="whitespace-pre-wrap break-words text-sm text-zinc-400">
                  {reply.body}
                </p>
                {user && (user.id === reply.author_id || isSelf) ? (
                  <button
                    type="button"
                    onClick={() => void remove("community_replies", reply.id)}
                    className="text-xs text-zinc-600 hover:text-red-300"
                  >
                    削除
                  </button>
                ) : null}
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={replyBodies[post.id] ?? ""}
                onChange={(event) =>
                  setReplyBodies((current) => ({
                    ...current,
                    [post.id]: event.target.value,
                  }))
                }
                placeholder="返信"
                maxLength={2000}
                className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => requireRegisteredWrite(() => reply(post.id))}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
              >
                返信
              </button>
            </div>
          </div>
        </article>
      ))}
      {communityId && posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          投稿はまだありません。
        </p>
      ) : null}
      {!communityId && !error ? (
        <p className="text-sm text-zinc-500">コミュニティは準備中です。</p>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
