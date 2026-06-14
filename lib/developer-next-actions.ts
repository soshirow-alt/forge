import type { DevlogEntry } from "@/lib/devlogs";
import { sortDevlogsNewestFirst } from "@/lib/devlogs";
import type { Game } from "@/lib/mock-games";
import type { ProjectFeedbackEntry } from "@/lib/supabase/user-engagement";

export type DeveloperNextAction = {
  id: string;
  kind:
    | "submit_first"
    | "feedback_summary"
    | "latest_feedback"
    | "feedback_pending"
    | "no_devlog";
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function countFeedbackByProject(
  entries: ProjectFeedbackEntry[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.projectId, (counts.get(entry.projectId) ?? 0) + 1);
  }
  return counts;
}

function latestDevlogForProject(
  projectId: string,
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): DevlogEntry | null {
  const devlogs = getDevlogsByProject(projectId);
  return devlogs.length > 0 ? sortDevlogsNewestFirst(devlogs)[0] : null;
}

export function projectNeedsDevlogAfterFeedback(
  projectId: string,
  feedbackEntries: ProjectFeedbackEntry[],
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
): boolean {
  const projectFeedback = feedbackEntries.filter(
    (entry) => entry.projectId === projectId,
  );
  if (projectFeedback.length === 0) {
    return false;
  }

  const latestFeedback = projectFeedback[0];
  const latestDevlog = latestDevlogForProject(projectId, getDevlogsByProject);

  if (!latestDevlog) {
    return true;
  }

  const feedbackAt = new Date(latestFeedback.item.createdAt).getTime();
  const devlogAt = new Date(latestDevlog.date).getTime();
  return feedbackAt > devlogAt;
}

export function buildDeveloperNextActions(
  ownedGames: Game[],
  feedbackEntries: ProjectFeedbackEntry[],
  getDevlogsByProject: (projectId: string) => DevlogEntry[],
  titleByProjectId: Map<string, string>,
): DeveloperNextAction[] {
  if (ownedGames.length === 0) {
    return [
      {
        id: "submit-first",
        kind: "submit_first",
        title: "最初の作品を投稿する",
        description:
          "Forge では投稿からループが始まります。作品を公開してプレイヤーからのフィードバックを集めましょう。",
        primaryHref: "/submit",
        primaryLabel: "作品を投稿する",
      },
    ];
  }

  const actions: DeveloperNextAction[] = [];

  if (feedbackEntries.length > 0) {
    actions.push({
      id: "feedback-summary",
      kind: "feedback_summary",
      title: `新しいフィードバック ${feedbackEntries.length} 件`,
      description:
        "プレイヤーから届いた改善材料があります。内容を確認し、開発ログで応えましょう。",
      primaryHref: "#developer-feedback",
      primaryLabel: "フィードバックを見る",
      secondaryHref: `/projects/${feedbackEntries[0].projectId}/devlog/new`,
      secondaryLabel: "最新FBから開発ログを書く",
    });

    const latest = feedbackEntries[0];
    const latestTitle = titleByProjectId.get(latest.projectId) ?? latest.projectId;

    actions.push({
      id: `latest-feedback-${latest.item.id}`,
      kind: "latest_feedback",
      title: `最新のフィードバック — ${latestTitle}`,
      description:
        "このフィードバックをもとに改善を記録しましょう。開発ログで版公開までつなげられます。",
      primaryHref: `/projects/${latest.projectId}/devlog/new`,
      primaryLabel: "このFBをもとに開発ログを書く",
      secondaryHref: `/games/${latest.projectId}`,
      secondaryLabel: "作品詳細を見る",
    });
  }

  const pendingProjects = ownedGames.filter((game) =>
    projectNeedsDevlogAfterFeedback(
      game.id,
      feedbackEntries,
      getDevlogsByProject,
    ),
  );

  for (const game of pendingProjects.slice(0, 3)) {
    if (latestFeedbackMatchesProject(feedbackEntries, game.id, actions)) {
      continue;
    }

    actions.push({
      id: `feedback-pending-${game.id}`,
      kind: "feedback_pending",
      title: `FBへの応答 — ${game.title}`,
      description:
        "フィードバック受信後、まだ開発ログが書かれていません。改善内容を記録して新版公開につなげましょう。",
      primaryHref: `/projects/${game.id}/devlog/new`,
      primaryLabel: "開発ログを書く",
      secondaryHref: `/projects/${game.id}/edit`,
      secondaryLabel: "投稿内容を編集する",
    });
  }

  const noDevlogGames = ownedGames.filter(
    (game) =>
      getDevlogsByProject(game.id).length === 0 &&
      !feedbackEntries.some((entry) => entry.projectId === game.id),
  );

  for (const game of noDevlogGames.slice(0, 2)) {
    actions.push({
      id: `no-devlog-${game.id}`,
      kind: "no_devlog",
      title: `開発ログを書く — ${game.title}`,
      description:
        "制作の進捗や改善予定を記録すると、プレイヤーが作品の方向性を理解しやすくなります。",
      primaryHref: `/projects/${game.id}/devlog/new`,
      primaryLabel: "開発ログを書く",
      secondaryHref: `/games/${game.id}`,
      secondaryLabel: "作品詳細を見る",
    });
  }

  return actions;
}

function latestFeedbackMatchesProject(
  feedbackEntries: ProjectFeedbackEntry[],
  projectId: string,
  actions: DeveloperNextAction[],
): boolean {
  if (feedbackEntries.length === 0) {
    return false;
  }

  return (
    feedbackEntries[0].projectId === projectId &&
    actions.some((action) => action.kind === "latest_feedback")
  );
}
