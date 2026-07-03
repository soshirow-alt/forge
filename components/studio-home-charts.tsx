"use client";

import type { ReactNode } from "react";
import { formatStudioHomeMonthLabel } from "@/lib/studio-home-metrics";

const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 12, right: 8, bottom: 28, left: 36 };

type ChartSize = {
  width: number;
  height: number;
};

function useChartInner(size: ChartSize) {
  const innerWidth = Math.max(0, size.width - CHART_PADDING.left - CHART_PADDING.right);
  const innerHeight = Math.max(0, size.height - CHART_PADDING.top - CHART_PADDING.bottom);
  return { innerWidth, innerHeight };
}

function computeYMax(values: number[]): number {
  const max = Math.max(0, ...values);
  if (max <= 0) {
    return 4;
  }
  if (max <= 4) {
    return 4;
  }
  return Math.ceil(max * 1.15);
}

function yTicks(max: number): number[] {
  const step = max <= 4 ? 1 : Math.ceil(max / 4);
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }
  if (ticks[ticks.length - 1] !== max) {
    ticks.push(max);
  }
  return ticks;
}

function ChartFrame({
  size,
  yMax,
  monthLabels,
  children,
}: {
  size: ChartSize;
  yMax: number;
  monthLabels: string[];
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
      className="overflow-visible"
    >
      {ticks.map((tick) => {
        const y =
          CHART_PADDING.top +
          innerHeight -
          (tick / yMax) * innerHeight;
        return (
          <g key={tick}>
            <line
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + innerWidth}
              y2={y}
              stroke="rgb(63 63 70 / 0.45)"
              strokeWidth={1}
            />
            <text
              x={CHART_PADDING.left - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-zinc-500 text-[10px]"
            >
              {tick}
            </text>
          </g>
        );
      })}
      <text
        x={CHART_PADDING.left}
        y={size.height - 4}
        className="fill-zinc-600 text-[10px]"
      >
        月
      </text>
      {monthLabels.map((label, index) => {
        const x =
          CHART_PADDING.left +
          (monthLabels.length <= 1
            ? innerWidth / 2
            : (index / (monthLabels.length - 1)) * innerWidth);
        return (
          <text
            key={`${label}-${index}`}
            x={x}
            y={size.height - 4}
            textAnchor="middle"
            className="fill-zinc-500 text-[10px]"
          >
            {label}
          </text>
        );
      })}
      <text
        x={8}
        y={CHART_PADDING.top + innerHeight / 2}
        transform={`rotate(-90 8 ${CHART_PADDING.top + innerHeight / 2})`}
        textAnchor="middle"
        className="fill-zinc-600 text-[10px]"
      >
        人
      </text>
      {children}
    </svg>
  );
}

export function StudioHomeStackedBarChart({
  months,
  series,
  colors,
}: {
  months: string[];
  series: { key: string; label: string; values: number[]; color: string }[];
  colors?: string[];
}) {
  const size: ChartSize = { width: 320, height: CHART_HEIGHT };
  const { innerWidth, innerHeight } = useChartInner(size);
  const monthLabels = months.map(formatStudioHomeMonthLabel);
  const totals = months.map((_, index) =>
    series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0),
  );
  const yMax = computeYMax(totals);
  const barWidth = months.length > 0 ? innerWidth / months.length : innerWidth;
  const palette = colors ?? series.map((item) => item.color);

  return (
    <ChartFrame size={size} yMax={yMax} monthLabels={monthLabels}>
      {months.map((month, monthIndex) => {
        const x = CHART_PADDING.left + monthIndex * barWidth + barWidth * 0.15;
        const width = barWidth * 0.7;
        let cursorY = CHART_PADDING.top + innerHeight;

        return (
          <g key={month}>
            {series.map((item, seriesIndex) => {
              const value = item.values[monthIndex] ?? 0;
              const height = yMax > 0 ? (value / yMax) * innerHeight : 0;
              cursorY -= height;
              return (
                <rect
                  key={item.key}
                  x={x}
                  y={cursorY}
                  width={width}
                  height={height}
                  rx={2}
                  fill={palette[seriesIndex] ?? item.color}
                  opacity={0.92}
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
  months,
  series,
}: {
  months: string[];
  series: { key: string; label: string; values: number[]; color: string }[];
}) {
  const size: ChartSize = { width: 320, height: CHART_HEIGHT };
  const { innerWidth, innerHeight } = useChartInner(size);
  const monthLabels = months.map(formatStudioHomeMonthLabel);
  const yMax = computeYMax(series.flatMap((item) => item.values));

  function pointAt(index: number, value: number) {
    const x =
      CHART_PADDING.left +
      (months.length <= 1 ? innerWidth / 2 : (index / (months.length - 1)) * innerWidth);
    const y =
      CHART_PADDING.top + innerHeight - (value / yMax) * innerHeight;
    return { x, y };
  }

  return (
    <ChartFrame size={size} yMax={yMax} monthLabels={monthLabels}>
      {series.map((item) => {
        const points = item.values.map((value, index) => pointAt(index, value));
        const path = points
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
          .join(" ");
        return (
          <g key={item.key}>
            <path
              d={path}
              fill="none"
              stroke={item.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point, index) => (
              <circle
                key={`${item.key}-${index}`}
                cx={point.x}
                cy={point.y}
                r={3}
                fill={item.color}
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
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
