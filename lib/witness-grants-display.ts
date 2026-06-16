import type { WitnessGrantPath } from "@/lib/witness-eligibility";

/** マイページ向け grant_path 表示名（W4） */
export const WITNESS_GRANT_PATH_PLAYER_LABELS: Record<WitnessGrantPath, string> = {
  multi_version: "複数の版を遊んだ",
  voice: "声を届けた",
  watch: "更新を追っていた",
};

export const WITNESS_PLAYER_HEADLINE = "正式版まで見届けました";

export const WITNESS_PLAYER_EXPLANATION =
  "正式版になる前にプレイし、声を届ける・複数版を遊ぶ・更新を追う、いずれかで関わった作品です。";
