/** Per-request display clock for Player IA relative times (SSR/client parity). */
export function createRequestNowMs(): number {
  return Date.now();
}
