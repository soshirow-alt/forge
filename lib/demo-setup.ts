import { mergeTagsWithRecruitment } from "@/lib/game-tags";
import type { DevlogEntry } from "@/lib/devlogs";
import type { SubmitFormData } from "@/lib/project-form";
import { insertDemoProjects } from "@/lib/supabase/projects";
import {
  deleteProjectDevlogsByProjectId,
  insertProjectDevlog,
} from "@/lib/supabase/project-devlogs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Game } from "@/lib/mock-games";

const SUPPORT_STORAGE_KEY = "forge-support-counts";
const APPLICANT_STORAGE_KEY = "forge-applicant-counts";
const FEEDBACK_STORAGE_KEY = "forge-game-feedback";

const DEMO_PROJECT_TITLES = [
  "星詠みの廃都",
  "ネオン・アーカイブ",
  "群青の境界",
] as const;

type DemoFeedbackItem = {
  id: string;
  text: string;
  createdAt: string;
  funRating: number;
  controlsRating: number;
  replayRating: number;
  selectedOptions: string[];
};

function createDemoThumbnail(label: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="demo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}"/>
        <stop offset="100%" stop-color="#18181b"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#demo-bg)"/>
    <rect x="40" y="40" width="560" height="280" rx="16" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <text x="320" y="188" text-anchor="middle" fill="#fafafa" font-size="28" font-family="sans-serif">${label}</text>
    <text x="320" y="224" text-anchor="middle" fill="#a1a1aa" font-size="16" font-family="sans-serif">DEMO</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createDemoProjectForms(ownerName: string): SubmitFormData[] {
  return [
    {
      title: "星詠みの廃都",
      genre: "アクションRPG",
      creator: ownerName,
      phase: "試作版",
      description:
        "星の欠片で魔法を紡ぐ探索アクションRPG。廃都を巡り、失われた詠唱を集めて世界の均衡を取り戻すデモ版です。",
      lookingForTesters: true,
      testerSlots: 12,
      thumbnailUrl: createDemoThumbnail("星詠みの廃都", "#ea580c"),
      tags: mergeTagsWithRecruitment(["RPG", "アクション"], true),
      playUrl: "https://example.com/demo/stellar-ruins",
      itchUrl: "https://example.itch.io/stellar-ruins-demo",
      githubUrl: "https://github.com/demo-forge/stellar-ruins",
    },
    {
      title: "ネオン・アーカイブ",
      genre: "パズル",
      creator: ownerName,
      phase: "プロトタイプ",
      description:
        "ネオンに彩られたデータ迷宮を解き明かすローグライク・パズル。記憶の断片を組み合わせ、失われた都市の真実に迫ります。",
      lookingForTesters: true,
      testerSlots: 8,
      thumbnailUrl: createDemoThumbnail("ネオン・アーカイブ", "#7c3aed"),
      tags: mergeTagsWithRecruitment(["パズル", "ローグライク"], true),
      playUrl: "https://example.com/demo/neon-archive",
      discordUrl: "https://discord.gg/demo-neon-archive",
    },
    {
      title: "群青の境界",
      genre: "ホラー",
      creator: ownerName,
      phase: "α版",
      description:
        "霧に包まれた離島で起きる協力型ホラー体験。仲間と連携しながら、境界の向こうから迫る存在から逃げ延びるサバイバルデモ。",
      lookingForTesters: true,
      testerSlots: 15,
      thumbnailUrl: createDemoThumbnail("群青の境界", "#0369a1"),
      tags: mergeTagsWithRecruitment(["ホラー", "協力プレイ"], true),
      playUrl: "https://example.com/demo/azure-border",
      steamUrl: "https://store.steampowered.com/app/demo-azure-border",
      officialUrl: "https://demo-forge.example/azure-border",
    },
  ];
}

function createDemoFeedback(projectIds: string[]): Record<string, DemoFeedbackItem[]> {
  const [project1, project2, project3] = projectIds;

  return {
    [project1]: [
      {
        id: "demo-feedback-1-1",
        text: "戦闘の手応えが良く、探索のテンポも快適でした。ボス戦の演出が特に印象的です。",
        createdAt: "2026-06-09T14:30:00.000Z",
        funRating: 5,
        controlsRating: 4,
        replayRating: 4,
        selectedOptions: ["戦闘が良い", "世界観が良い", "もっと遊びたい"],
      },
      {
        id: "demo-feedback-1-2",
        text: "詠唱システムの説明がもう少し欲しいです。チュートリアルを追加するとより遊びやすくなりそう。",
        createdAt: "2026-06-08T10:15:00.000Z",
        funRating: 4,
        controlsRating: 3,
        replayRating: 4,
        selectedOptions: ["チュートリアルが必要", "世界観が良い"],
      },
    ],
    [project2]: [
      {
        id: "demo-feedback-2-1",
        text: "パズルの難易度曲線が良いです。ネオンの演出と相まって没入感があります。",
        createdAt: "2026-06-07T18:45:00.000Z",
        funRating: 4,
        controlsRating: 5,
        replayRating: 5,
        selectedOptions: ["世界観が良い", "もっと遊びたい"],
      },
    ],
    [project3]: [
      {
        id: "demo-feedback-3-1",
        text: "協力プレイの緊張感が素晴らしい。音声チャット必須の雰囲気がホラーとして機能しています。",
        createdAt: "2026-06-06T21:00:00.000Z",
        funRating: 5,
        controlsRating: 4,
        replayRating: 3,
        selectedOptions: ["世界観が良い", "テンポが悪い"],
      },
      {
        id: "demo-feedback-3-2",
        text: "操作説明が分かりづらい場面がありました。UIの改善を期待しています。",
        createdAt: "2026-06-05T16:20:00.000Z",
        funRating: 3,
        controlsRating: 2,
        replayRating: 4,
        selectedOptions: ["操作が分かりづらい", "チュートリアルが必要"],
      },
    ],
  };
}

function createDemoDevlogs(projectIds: string[]): DevlogEntry[] {
  const [project1, project2, project3] = projectIds;

  return [
    {
      id: "demo-devlog-1-1",
      projectId: project1,
      title: "試作版デモを公開しました",
      content:
        "星詠みの廃都の試作版を公開しました。テスターの皆さんからのフィードバックをお待ちしています。",
      date: "2026-06-10",
    },
    {
      id: "demo-devlog-1-2",
      projectId: project1,
      title: "ボス戦プロトタイプを追加",
      content: "廃都最深部のボス戦プロトタイプを実装しました。難易度調整中です。",
      date: "2026-06-07",
    },
    {
      id: "demo-devlog-2-1",
      projectId: project2,
      title: "パズルステージを10面追加",
      content:
        "ネオン・アーカイブに新ステージを追加しました。記憶の断片パズルのバリエーションを拡充しています。",
      date: "2026-06-08",
    },
    {
      id: "demo-devlog-3-1",
      projectId: project3,
      title: "α版テスト開始のお知らせ",
      content:
        "群青の境界のα版テストを開始しました。3人協力プレイでのフィードバックを募集しています。",
      date: "2026-06-05",
    },
    {
      id: "demo-devlog-3-2",
      projectId: project3,
      title: "霧エフェクトと音響を改善",
      content: "離島の霧表現と環境音を調整し、ホラー演出を強化しました。",
      date: "2026-06-03",
    },
  ];
}

function removeDemoLocalData(existingProjectIds: string[]) {
  const supportCounts = JSON.parse(
    localStorage.getItem(SUPPORT_STORAGE_KEY) || "{}",
  ) as Record<string, number>;
  for (const id of existingProjectIds) {
    delete supportCounts[id];
  }

  const applicantCounts = JSON.parse(
    localStorage.getItem(APPLICANT_STORAGE_KEY) || "{}",
  ) as Record<string, number>;
  for (const id of existingProjectIds) {
    delete applicantCounts[id];
  }

  const feedback = JSON.parse(
    localStorage.getItem(FEEDBACK_STORAGE_KEY) || "{}",
  ) as Record<string, DemoFeedbackItem[]>;
  for (const id of existingProjectIds) {
    delete feedback[id];
  }

  return { supportCounts, applicantCounts, feedback };
}

export async function setupDemoEnvironment(
  supabase: SupabaseClient,
  ownerId: string,
  ownerName: string,
): Promise<Game[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const demoProjects = await insertDemoProjects(
    supabase,
    ownerId,
    ownerName,
    createDemoProjectForms(ownerName),
  );

  const projectIds = demoProjects.map((project) => project.id);
  const supportTotals = [47, 32, 19];
  const applicantTotals = [5, 3, 7];

  try {
    const previousIds = JSON.parse(
      localStorage.getItem("forge-demo-project-ids") || "[]",
    ) as string[];

    const { supportCounts, applicantCounts, feedback } =
      removeDemoLocalData(previousIds);

    for (const oldId of previousIds) {
      await deleteProjectDevlogsByProjectId(supabase, oldId).catch(() => undefined);
    }

    projectIds.forEach((id, index) => {
      supportCounts[id] = supportTotals[index] ?? 0;
      applicantCounts[id] = applicantTotals[index] ?? 0;
    });

    Object.assign(feedback, createDemoFeedback(projectIds));

    localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(supportCounts));
    localStorage.setItem(APPLICANT_STORAGE_KEY, JSON.stringify(applicantCounts));
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
    localStorage.setItem(
      "forge-demo-project-ids",
      JSON.stringify(projectIds),
    );

    for (const devlog of createDemoDevlogs(projectIds)) {
      await insertProjectDevlog(
        supabase,
        ownerId,
        devlog.projectId,
        devlog.title,
        devlog.content,
      ).catch(() => undefined);
    }
  } catch {
    // ignore storage errors
  }

  return demoProjects;
}

export { DEMO_PROJECT_TITLES };
