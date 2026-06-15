export type DevlogEntry = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  date: string;
  publishedVersion?: string;
};

export const mockDevlogs: DevlogEntry[] = [
  {
    id: "devlog-emberfall-1",
    projectId: "emberfall",
    title: "戦闘プロトタイプを公開",
    content:
      "剣戟コンボと回避アクションの初期版を実装しました。プレイヤーの回答をお待ちしています。",
    date: "2026-06-01",
  },
  {
    id: "devlog-rift-runner-1",
    projectId: "rift-runner",
    title: "α版テスト開始",
    content:
      "次元切り替えの操作性を改善しました。テスター募集にご協力ください。",
    date: "2026-06-07",
  },
  {
    id: "devlog-aetherborn-1",
    projectId: "aetherborn",
    title: "β版アップデート",
    content: "ギルド機能と雲の海エリアを追加しました。",
    date: "2026-05-28",
  },
];

export function groupDevlogsByProject(
  devlogs: DevlogEntry[],
): Record<string, DevlogEntry[]> {
  return devlogs.reduce<Record<string, DevlogEntry[]>>((acc, entry) => {
    if (!acc[entry.projectId]) {
      acc[entry.projectId] = [];
    }
    acc[entry.projectId].push(entry);
    return acc;
  }, {});
}

export function sortDevlogsNewestFirst(devlogs: DevlogEntry[]): DevlogEntry[] {
  return [...devlogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
