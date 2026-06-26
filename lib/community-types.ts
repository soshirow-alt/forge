/** コミュニティ投稿で引用する確認依頼 */

export type ConfirmationRequestQuoteRef = {
  id: string;
  confirmationRequestId: string;
  devlogId: string;
  gameId: string;
  version: string;
  title: string;
  changesSummary: string;
  askSummary: string;
  estimatedDuration: string;
  linkedPriorityTitles?: string[];
  publishedAt?: string;
};

export function confirmationQuoteHref(quote: ConfirmationRequestQuoteRef): string {
  return `/games/${quote.gameId}#change-check-card`;
}
