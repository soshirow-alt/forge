import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConfirmationRequestQuoteRef } from "@/lib/community-types";
import type { DevlogQuoteRef } from "@/lib/community-v0-mock-data";
import type { CommunityPost, CommunityReply } from "@/lib/community-v0-mock-data";

type CommunityRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  handle: string | null;
};

type MembershipRow = {
  community_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  joined_at: string;
};

type PostRow = {
  id: string;
  community_id: string;
  author_id: string;
  author_role: "developer" | "player";
  body: string;
  audience_label: string;
  devlog_id: string | null;
  confirmation_request_id: string | null;
  devlog_quote: DevlogQuoteRef | null;
  confirmation_quote: ConfirmationRequestQuoteRef | null;
  created_at: string;
};

type ReplyRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export function isCommunitiesTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : String(error);

  return (
    (message.includes("developer_communities") ||
      message.includes("community_posts") ||
      message.includes("community_memberships")) &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function ensureDeveloperCommunity(
  supabase: SupabaseClient,
  input: {
    id: string;
    ownerId: string;
    name: string;
    description: string;
    avatarUrl?: string | null;
    handle?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("developer_communities").upsert(
    {
      id: input.id,
      owner_id: input.ownerId,
      name: input.name,
      description: input.description,
      avatar_url: input.avatarUrl ?? null,
      handle: input.handle ?? null,
    },
    { onConflict: "id" },
  );

  if (error && !isCommunitiesTableMissingError(error)) {
    throw error;
  }
}

export async function fetchCommunityMembershipStatus(
  supabase: SupabaseClient,
  communityId: string,
  userId: string,
): Promise<"none" | "pending" | "approved" | "rejected"> {
  const { data, error } = await supabase
    .from("community_memberships")
    .select("status")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isCommunitiesTableMissingError(error)) {
      return "none";
    }
    throw error;
  }

  if (!data) {
    return "none";
  }

  return (data as MembershipRow).status;
}

export async function applyCommunityMembership(
  supabase: SupabaseClient,
  communityId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from("community_memberships").upsert(
    {
      community_id: communityId,
      user_id: userId,
      status: "pending",
    },
    { onConflict: "community_id,user_id" },
  );

  if (error && !isCommunitiesTableMissingError(error)) {
    throw error;
  }
}

export async function setCommunityMembershipStatus(
  supabase: SupabaseClient,
  communityId: string,
  userId: string,
  status: "approved" | "rejected",
): Promise<void> {
  const { error } = await supabase
    .from("community_memberships")
    .update({ status, joined_at: new Date().toISOString() })
    .eq("community_id", communityId)
    .eq("user_id", userId);

  if (error && !isCommunitiesTableMissingError(error)) {
    throw error;
  }
}

export async function fetchApprovedCommunityMemberIds(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<string[]> {
  const { data: community, error: communityError } = await supabase
    .from("developer_communities")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (communityError) {
    if (isCommunitiesTableMissingError(communityError)) {
      return [];
    }
    throw communityError;
  }

  if (!community) {
    return [];
  }

  const { data, error } = await supabase
    .from("community_memberships")
    .select("user_id")
    .eq("community_id", (community as CommunityRow).id)
    .eq("status", "approved");

  if (error) {
    if (isCommunitiesTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  return (data ?? []).map((row) => (row as { user_id: string }).user_id);
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "たった今";
  }
  if (minutes < 60) {
    return `${minutes}分前`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}時間前`;
  }
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

function mapPostRow(
  row: PostRow,
  author: { name: string; handle: string; avatar: string },
  replies: CommunityReply[],
): CommunityPost {
  return {
    id: row.id,
    communityId: row.community_id,
    authorRole: row.author_role,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorHandle: author.handle,
    body: row.body,
    postedAt: formatRelativeTime(row.created_at),
    audienceLabel: row.audience_label,
    devlogQuote: row.devlog_quote ?? undefined,
    confirmationQuote: row.confirmation_quote ?? undefined,
    replies,
  };
}

export async function fetchCommunityPosts(
  supabase: SupabaseClient,
  communityId: string,
  authorResolver: (authorId: string) => {
    name: string;
    handle: string;
    avatar: string;
  },
): Promise<CommunityPost[]> {
  const { data: posts, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isCommunitiesTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  if (!posts || posts.length === 0) {
    return [];
  }

  const postIds = posts.map((row) => (row as PostRow).id);
  const { data: replies, error: repliesError } = await supabase
    .from("community_replies")
    .select("*")
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (repliesError && !isCommunitiesTableMissingError(repliesError)) {
    throw repliesError;
  }

  const repliesByPost = new Map<string, CommunityReply[]>();
  for (const row of (replies ?? []) as ReplyRow[]) {
    const author = authorResolver(row.author_id);
    const reply: CommunityReply = {
      id: row.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      authorHandle: author.handle,
      body: row.body,
      postedAt: formatRelativeTime(row.created_at),
    };
    const list = repliesByPost.get(row.post_id) ?? [];
    list.push(reply);
    repliesByPost.set(row.post_id, list);
  }

  return (posts as PostRow[]).map((row) =>
    mapPostRow(row, authorResolver(row.author_id), repliesByPost.get(row.id) ?? []),
  );
}

export async function insertCommunityPost(
  supabase: SupabaseClient,
  input: {
    communityId: string;
    authorId: string;
    authorRole: "developer" | "player";
    body: string;
    audienceLabel?: string;
    devlogQuote?: DevlogQuoteRef;
    confirmationQuote?: ConfirmationRequestQuoteRef;
    devlogId?: string | null;
    confirmationRequestId?: string | null;
  },
): Promise<CommunityPost | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      community_id: input.communityId,
      author_id: input.authorId,
      author_role: input.authorRole,
      body: input.body,
      audience_label: input.audienceLabel ?? "コミュニティ全員",
      devlog_id: input.devlogId ?? null,
      confirmation_request_id: input.confirmationRequestId ?? null,
      devlog_quote: input.devlogQuote ?? null,
      confirmation_quote: input.confirmationQuote ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (isCommunitiesTableMissingError(error)) {
      return null;
    }
    throw error;
  }

  const row = data as PostRow;
  return mapPostRow(
    row,
    { name: "あなた", handle: "you", avatar: "/images/landing/game-4.png" },
    [],
  );
}

export async function insertCommunityReply(
  supabase: SupabaseClient,
  input: {
    postId: string;
    authorId: string;
    body: string;
    author: { name: string; handle: string; avatar: string };
  },
): Promise<CommunityReply | null> {
  const { data, error } = await supabase
    .from("community_replies")
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body,
    })
    .select("*")
    .single();

  if (error) {
    if (isCommunitiesTableMissingError(error)) {
      return null;
    }
    throw error;
  }

  const row = data as ReplyRow;
  return {
    id: row.id,
    authorName: input.author.name,
    authorAvatar: input.author.avatar,
    authorHandle: input.author.handle,
    body: row.body,
    postedAt: "たった今",
  };
}

export async function fetchConfirmationQuoteOptionsForOwner(
  supabase: SupabaseClient,
  ownerId: string,
  limit = 8,
): Promise<ConfirmationRequestQuoteRef[]> {
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, title, playable_version")
    .eq("owner_id", ownerId);

  if (projectsError) {
    return [];
  }

  const projectIds = (projects ?? []).map((row) => String((row as { id: string }).id));
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("confirmation_requests")
    .select(
      "id, devlog_id, project_id, published_version, changes_summary, ask_summary, estimated_duration, linked_priorities, created_at",
    )
    .in("project_id", projectIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isCommunitiesTableMissingError(error)) {
      return [];
    }
    return [];
  }

  return (data ?? []).map((row) => {
    const record = row as {
      id: string;
      devlog_id: string;
      project_id: string;
      published_version: string | null;
      changes_summary: string | null;
      ask_summary: string | null;
      estimated_duration: string | null;
      linked_priorities: { title: string }[] | null;
      created_at: string;
    };
    const project = (projects ?? []).find(
      (item) => String((item as { id: string }).id) === record.project_id,
    ) as { title: string; playable_version: string | null } | undefined;

    return {
      id: `cq-${record.id}`,
      confirmationRequestId: record.id,
      devlogId: record.devlog_id,
      gameId: record.project_id,
      version: record.published_version ?? project?.playable_version ?? "—",
      title: project?.title ?? "開発ログ",
      changesSummary: record.changes_summary ?? "",
      askSummary: record.ask_summary ?? "",
      estimatedDuration: record.estimated_duration ?? "",
      linkedPriorityTitles: (record.linked_priorities ?? []).map((item) => item.title),
      publishedAt: new Date(record.created_at).toLocaleDateString("ja-JP"),
    } satisfies ConfirmationRequestQuoteRef;
  });
}
