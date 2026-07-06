/**
 * Dev-only performance logging for Forge navigation and data loading.
 * Enable in production preview with NEXT_PUBLIC_FORGE_PERF_LOG=1.
 */

const PERF_PREFIX = "[forge:perf]";

export function isForgePerfLogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_FORGE_PERF_LOG === "1") {
    return true;
  }
  return process.env.NODE_ENV === "development";
}

export function forgePerfLog(
  label: string,
  detail?: Record<string, unknown>,
): void {
  if (!isForgePerfLogEnabled()) {
    return;
  }

  if (detail) {
    console.info(PERF_PREFIX, label, detail);
    return;
  }

  console.info(PERF_PREFIX, label);
}

export function forgePerfMark(name: string): void {
  if (!isForgePerfLogEnabled() || typeof performance === "undefined") {
    return;
  }

  performance.mark(`forge:${name}`);
}

export function forgePerfMeasure(
  label: string,
  startMark: string,
  detail?: Record<string, unknown>,
): number | null {
  if (!isForgePerfLogEnabled() || typeof performance === "undefined") {
    return null;
  }

  const start = `forge:${startMark}`;
  const end = `forge:${startMark}:end`;

  try {
    performance.mark(end);
    const measure = performance.measure(`forge:${label}`, start, end);
    const durationMs = Math.round(measure.duration * 10) / 10;
    forgePerfLog(label, { durationMs, ...detail });
    return durationMs;
  } catch {
    forgePerfLog(label, { durationMs: null, ...detail });
    return null;
  } finally {
    performance.clearMarks(start);
    performance.clearMarks(end);
    performance.clearMeasures(`forge:${label}`);
  }
}

export async function forgePerfTimed<T>(
  label: string,
  fn: () => Promise<T>,
  detail?: Record<string, unknown>,
): Promise<T> {
  if (!isForgePerfLogEnabled()) {
    return fn();
  }

  const mark = `${label}:${Date.now()}`;
  forgePerfMark(mark);
  try {
    return await fn();
  } finally {
    forgePerfMeasure(label, mark, detail);
  }
}
