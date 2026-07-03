"use client";

import type { ReactNode } from "react";
import type { StudioHomeGranularity } from "@/lib/studio-home-metrics";
import { formatStudioHomePeriodChartLabel } from "@/lib/studio-home-metrics";

const CHART_HEIGHT = 188;
const CHART_PADDING = { top: 12, right: 8, bottom: 26, left: 28 };

type ChartSize = {
  width: number;
  height: number;
};

function useChartInner(size: ChartSize) {
  const innerWidth = Math.max(0, size.width - CHART_PADDING.left - CHART_PADDING.right);
  const innerHeight = Math.max(0, size.height - CHART_PADDING.top - CHART_PADDING.bottom);
  return { innerWidth, innerHeight };
}

function xAtIndex(index: number, count: number, innerWidth: number, left: number): number {
  if (count <= 1) {
    return left + innerWidth / 2;
  }
  return left + (index / (count - 1)) * innerWidth;
}

function computeDataMax(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.max(0, ...values);
}

/** 1–2–5–10 系の「きりのいい」刻み幅 */
function niceStep(roughStep: number): number {
  if (roughStep <= 0) {
    return 1;
  }
  const exponent = Math.floor(Math.log10(roughStep));
  const magnitude = 10 ** exponent;
  const normalized = roughStep / magnitude;
  if (normalized <= 1) {
    return magnitude;
  }
  if (normalized <= 2) {
    return 2 * magnitude;
  }
  if (normalized <= 5) {
    return 5 * magnitude;
  }
  return 10 * magnitude;
}

const Y_AXIS_MIN_MAX = 4;

/** データ最大値から Y 軸上限を算出（固定 maxY なし。少人数時は最低 4） */
function computeYMax(values: number[]): number {
  const dataMax = computeDataMax(values);
  if (dataMax <= 0) {
    return Y_AXIS_MIN_MAX;
  }
  if (dataMax <= Y_AXIS_MIN_MAX) {
    return Y_AXIS_MIN_MAX;
  }

  const paddedMax = dataMax * 1.08;
  const step = niceStep(paddedMax / 4);
  const niceMax = Math.ceil(paddedMax / step) * step;
  return Math.max(niceMax, Y_AXIS_MIN_MAX);
}

function yTicks(yMax: number): number[] {
  if (yMax <= Y_AXIS_MIN_MAX) {
    return Array.from({ length: Y_AXIS_MIN_MAX + 1 }, (_, index) => index);
  }

  const step = niceStep(yMax / 4);
  const ticks: number[] = [];
  for (let value = 0; value <= yMax; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== yMax) {
    ticks.push(yMax);
  }
  return ticks;
}

function ChartFrame({
  size,
  yMax,
  periodLabels,
  children,
}: {
  size: ChartSize;
  yMax: number;
  periodLabels: string[];
  children: ReactNode;
}) {
  const { innerWidth, innerHeight } = useChartInner(size);
  const ticks = yTicks(yMax);

  return (
    <svg
      width="100%"
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      role="img"
      aria-hidden="true"
      className="overflow-hidden"
    >
      <defs>
        <linearGradient id="studio-chart-grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(82 82 91)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(82 82 91)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => {
        const y = CHART_PADDING.top + innerHeight - (tick / yMax) * innerHeight;
        return (
          <g key={tick}>
            <line
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + innerWidth}
              y2={y}
              stroke="url(#studio-chart-grid-fade)"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? undefined : "4 4"}
            />
            <text
              x={CHART_PADDING.left - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-zinc-500 text-[10px] font-medium tabular-nums"
            >
              {tick}
            </text>
          </g>
        );
      })}
      {periodLabels.map((label, index) => {
        const x = xAtIndex(index, periodLabels.length, innerWidth, CHART_PADDING.left);
        return (
          <text
            key={`${label}-${index}`}
            x={x}
            y={size.height - 8}
            textAnchor="middle"
            className="fill-zinc-400 text-[10px] font-medium"
          >
            {label}
          </text>
        );
      })}
      {children}
    </svg>
  );
}

function gradientId(key: string) {
  return `studio-chart-${key}`;
}

export function StudioHomeStackedBarChart({
  periods,
  granularity,
  series,
}: {
  periods: string[];
  granularity: StudioHomeGranularity;
  series: { key: string; label: string; values: number[]; color: string }[];
}) {
  const size: ChartSize = { width: 360, height: CHART_HEIGHT };
  const { innerWidth, innerHeight } = useChartInner(size);
  const periodLabels = periods.map((period) =>
    formatStudioHomePeriodChartLabel(period, granularity),
  );
  const totals = periods.map((_, index) =>
    series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0),
  );
  const yMax = computeYMax(totals);
  const barSpan =
    periods.length <= 1 ? innerWidth * 0.4 : (innerWidth / (periods.length - 1)) * 0.55;

  return (
    <ChartFrame size={size} yMax={yMax} periodLabels={periodLabels}>
      <defs>
        {series.map((item) => (
          <linearGradient
            key={item.key}
            id={gradientId(item.key)}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={item.color} stopOpacity="1" />
            <stop offset="100%" stopColor={item.color} stopOpacity="0.55" />
          </linearGradient>
        ))}
      </defs>
      {periods.map((period, periodIndex) => {
        const centerX = xAtIndex(
          periodIndex,
          periods.length,
          innerWidth,
          CHART_PADDING.left,
        );
        const x = centerX - barSpan / 2;
        let cursorY = CHART_PADDING.top + innerHeight;

        return (
          <g key={period}>
            {series.map((item) => {
              const value = item.values[periodIndex] ?? 0;
              const height = yMax > 0 ? (value / yMax) * innerHeight : 0;
              cursorY -= height;
              return (
                <rect
                  key={item.key}
                  x={x}
                  y={cursorY}
                  width={barSpan}
                  height={height}
                  rx={4}
                  fill={`url(#${gradientId(item.key)})`}
                />
              );
            })}
          </g>
        );
      })}
    </ChartFrame>
  );
}

export function StudioHomeMultiLineChart({
  periods,
  granularity,
  series,
  fillAreas = false,
}: {
  periods: string[];
  granularity: StudioHomeGranularity;
  series: { key: string; label: string; values: number[]; color: string }[];
  fillAreas?: boolean;
}) {
  const size: ChartSize = { width: 360, height: CHART_HEIGHT };
  const { innerWidth, innerHeight } = useChartInner(size);
  const periodLabels = periods.map((period) =>
    formatStudioHomePeriodChartLabel(period, granularity),
  );
  const yMax = computeYMax(series.flatMap((item) => item.values));

  function pointAt(index: number, value: number) {
    const x = xAtIndex(index, periods.length, innerWidth, CHART_PADDING.left);
    const rawY = CHART_PADDING.top + innerHeight - (value / yMax) * innerHeight;
    const y = Math.max(CHART_PADDING.top, rawY);
    return { x, y };
  }

  const baselineY = CHART_PADDING.top + innerHeight;

  return (
    <ChartFrame size={size} yMax={yMax} periodLabels={periodLabels}>
      <defs>
        {series.map((item) => (
          <linearGradient
            key={`area-${item.key}`}
            id={gradientId(`area-${item.key}`)}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={item.color} stopOpacity="0.35" />
            <stop offset="85%" stopColor={item.color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={item.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {series.map((item) => {
        const points = item.values.map((value, index) => pointAt(index, value));
        const path = points
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
          .join(" ");
        const areaPath =
          points.length > 0
            ? `${path} L ${points[points.length - 1]?.x ?? 0} ${baselineY} L ${points[0]?.x ?? 0} ${baselineY} Z`
            : "";

        return (
          <g key={item.key}>
            {fillAreas && areaPath ? (
              <path d={areaPath} fill={`url(#${gradientId(`area-${item.key}`)})`} />
            ) : null}
            <path
              d={path}
              fill="none"
              stroke={item.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 6px ${item.color}55)` }}
            />
            {points.map((point, index) => (
              <circle
                key={`${item.key}-${index}`}
                cx={point.x}
                cy={point.y}
                r={3.5}
                fill={item.color}
                stroke="rgb(9 9 11)"
                strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 4px ${item.color}66)` }}
              />
            ))}
          </g>
        );
      })}
    </ChartFrame>
  );
}

export function StudioHomeChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span
            className="size-2.5 shrink-0 rounded-full shadow-sm"
            style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}66` }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
