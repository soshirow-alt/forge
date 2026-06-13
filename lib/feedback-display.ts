import type { GameFeedbackItem } from "@/lib/game-feedback-storage";
import { replayIntentLabel } from "@/lib/game-feedback-storage";

export type FeedbackFieldTone = "good" | "concern" | "bug" | "focus" | "neutral";

export type FeedbackDisplayField = {
  label: string;
  value: string;
  tone: FeedbackFieldTone;
};

export function formatFeedbackDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getFeedbackDisplayFields(
  item: GameFeedbackItem,
): FeedbackDisplayField[] {
  const fields: FeedbackDisplayField[] = [];

  if (item.goodPoints?.trim()) {
    fields.push({
      label: "良かった点",
      value: item.goodPoints.trim(),
      tone: "good",
    });
  }
  if (item.concerns?.trim()) {
    fields.push({
      label: "気になった点",
      value: item.concerns.trim(),
      tone: "concern",
    });
  }
  if (item.bugs?.trim()) {
    fields.push({
      label: "バグっぽい挙動",
      value: item.bugs.trim(),
      tone: "bug",
    });
  }
  if (item.focusResponse?.trim()) {
    fields.push({
      label: "観点への回答",
      value: item.focusResponse.trim(),
      tone: "focus",
    });
  }

  return fields;
}

export function getReplayIntentDisplay(item: GameFeedbackItem): string | null {
  if (!item.wouldReplay) {
    return null;
  }
  return replayIntentLabel(item.wouldReplay);
}

export const FEEDBACK_TONE_STYLES: Record<
  FeedbackFieldTone,
  { label: string; value: string }
> = {
  good: { label: "text-emerald-500/80", value: "text-zinc-300" },
  concern: { label: "text-amber-500/80", value: "text-zinc-300" },
  bug: { label: "text-red-400/80", value: "text-zinc-300" },
  focus: { label: "text-orange-400/80", value: "text-zinc-300" },
  neutral: { label: "text-zinc-500", value: "text-zinc-300" },
};
