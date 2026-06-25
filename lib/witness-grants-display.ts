import type { WitnessGrantPath } from "@/lib/witness-eligibility";

/** マイページ向け grant_path 表示名（W4） */
export const WITNESS_GRANT_PATH_PLAYER_LABELS: Record<WitnessGrantPath, string> = {
  multi_version: "複数のverを遊んだ",
  voice: "フィードバック済",
  watch: "更新を追っていた",
};

export const WITNESS_PLAYER_HEADLINE = "正式verまで見届けました";

export const WITNESS_PLAYER_EXPLANATION =
  "正式verになる前にプレイし、フィードバックする・複数verを遊ぶ・更新を追う、いずれかで関わった作品です。";
