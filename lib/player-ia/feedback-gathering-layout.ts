/**
 * Home「フィードバックが集まっている作品」chrome only.
 * Ranking / candidate selection stays in assemblePlayerIaHomeShelves.
 *
 * Production 2026-08-11 observed 3 candidates; always-on lg:grid-cols-2
 * left an empty right column when queue < 3 (and a hole when count === 1).
 */
export type FeedbackGatheringLayout = {
  show: boolean;
  queueSlots: 0 | 1 | 2 | 3;
  gridCols: 1 | 2;
};

export function resolveFeedbackGatheringLayout(
  candidateCount: number,
): FeedbackGatheringLayout {
  if (candidateCount <= 0) {
    return { show: false, queueSlots: 0, gridCols: 1 };
  }
  if (candidateCount === 1) {
    return { show: true, queueSlots: 0, gridCols: 1 };
  }
  if (candidateCount === 2) {
    return { show: true, queueSlots: 1, gridCols: 2 };
  }
  if (candidateCount === 3) {
    return { show: true, queueSlots: 2, gridCols: 2 };
  }
  return { show: true, queueSlots: 3, gridCols: 2 };
}
