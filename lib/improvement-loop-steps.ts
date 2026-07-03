import type { NurtureDisplayContext, ProjectGrowthSnapshot } from "@/lib/project-growth-state";
import { getStudioVisualMode } from "@/lib/project-growth-state";

export type ImprovementLoopStepId =
  | "collect"
  | "decide"
  | "improve"
  | "publish"
  | "wait";

export type ImprovementLoopStepState = "done" | "current" | "upcoming";

export const IMPROVEMENT_LOOP_STEPS: {
  id: ImprovementLoopStepId;
  number: number;
  label: string;
  sublabel: string;
}[] = [
  {
    id: "collect",
    number: 1,
    label: "FBを集める",
    sublabel: "プレイヤーFBを受け取る",
  },
  {
    id: "decide",
    number: 2,
    label: "次に直すことを決める",
    sublabel: "優先順位を決める",
  },
  {
    id: "improve",
    number: 3,
    label: "改善・修正する",
    sublabel: "ゲームを直す",
  },
  {
    id: "publish",
    number: 4,
    label: "記録・公開する",
    sublabel: "開発ログとverを公開",
  },
  {
    id: "wait",
    number: 5,
    label: "次のFBを待つ",
    sublabel: "このverを完了",
  },
];

export function getImprovementLoopStepStates(
  snapshot: ProjectGrowthSnapshot,
  display: NurtureDisplayContext,
  voiceRead: boolean,
): ImprovementLoopStepState[] {
  const mode = getStudioVisualMode(snapshot);
  const states: ImprovementLoopStepState[] = [
    "upcoming",
    "upcoming",
    "upcoming",
    "upcoming",
    "upcoming",
  ];

  if (mode === "pre_cycle") {
    states[0] = "current";
    return states;
  }

  if (mode === "cycle_complete") {
    return ["done", "done", "done", "done", "current"];
  }

  const hasVoice = snapshot.totalVoiceResponseCount > 0;

  if (!hasVoice) {
    states[0] = "current";
    return states;
  }

  if (!voiceRead) {
    states[0] = "current";
    return states;
  }

  states[0] = "done";
  states[1] = "done";

  if (display.nowStepId === "improving") {
    states[2] = "current";
    return states;
  }

  if (display.nowStepId === "devlog" || display.nowStepId === "publish") {
    states[2] = "done";
    states[3] = "current";
    return states;
  }

  if (display.nowStepId === "wait") {
    states[2] = "done";
    states[3] = "done";
    states[4] = "current";
    return states;
  }

  states[1] = "current";
  return states;
}

export function getActiveImprovementLoopStepId(
  states: ImprovementLoopStepState[],
): ImprovementLoopStepId {
  const currentIndex = states.findIndex((state) => state === "current");
  if (currentIndex >= 0) {
    return IMPROVEMENT_LOOP_STEPS[currentIndex].id;
  }
  return "wait";
}
