/**
 * Whole-Home「フィードバックが集まっている作品」layout.
 * Canonical visual is always 4 slots: left hero + right 3 (reals then placeholders).
 * Rotation / dots only consider real projects (see category-home-hero).
 */
export type FeedbackGatheringLayout = {
  show: boolean;
  /** Always 3 when shown — right rail visual slots, not real count. */
  queueSlots: 0 | 1 | 2 | 3;
  gridCols: 1 | 2;
};

export function resolveFeedbackGatheringLayout(
  count: number,
): FeedbackGatheringLayout {
  if (count <= 0) {
    return { show: false, queueSlots: 0, gridCols: 1 };
  }
  return { show: true, queueSlots: 3, gridCols: 2 };
}
