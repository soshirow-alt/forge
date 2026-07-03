"use client";

import type { ReactNode } from "react";
import { formatStudioHomeMonthLabel } from "@/lib/studio-home-metrics";

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 12, bottom: 32, left: 40 };

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
      <defs>
        <linearGradient id="studio-chart-grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(63 63 70)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(63 63 70)" stopOpacity="0.08" />
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
              x={CHART_PADDING.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-zinc-500 text-[11px] font-medium"
            >
              {tick}
            </text>
          </g>
        );
      })}
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
            y={size.height - 8}
            textAnchor="middle"
            className="fill-zinc-400 text-[11px] font-medium"
          >
            {label}
          </text>
        );
      })}
      <text
        x={10}
        y={CHART_PADDING.top + innerHeight / 2}
        transform={`rotate(-90 10 ${CHART_PADDING.top + innerHeight / 2})`}
        textAnchor="middle"
        className="fill-zinc-500 text-[10px] font-medium"
      >
        人
      </text>
      {children}
    </svg>
  );
}

function gradientId(key: string) {
  return `studio-chart-${key}`;
}

export function StudioHomeStackedBarChart({
  months,
  series,
}: {
  months: string[];
  series: { key: string; label: string; values: number[]; color: string }[];
}) {
  const size: ChartSize = { width: 360, height: CHART_HEIGHT };
  const { innerWidth, innerHeight } = useChartInner(size);
  const monthLabels = months.map(formatStudioHomeMonthLabel);
  const totals = months.map((_, index) =>
    series.reduce((sum, item) => sum + (item.values[index] ?? 0), 0),
  );
  const yMax = computeYMax(totals);
  const barWidth = months.length > 0 ? innerWidth / months.length : innerWidth;

  return (
    <ChartFrame size={size} yMax={yMax} monthLabels={monthLabels}>
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
      {months.map((month, monthIndex) => {
        const x = CHART_PADDING.left + monthIndex * barWidth + barWidth * 0.12;
        const width = barWidth * 0.76;
        let cursorY = CHART_PADDING.top + innerHeight;

        return (
          <g key={month}>
            {series.map((item) => {
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
  months,
  series,
  fillAreas = false,
}: {
  months: string[];
  series: { key: string; label: string; values: number[]; color: string }[];
  fillAreas?: boolean;
}) {
  const size: ChartSize = { width: 360, height: CHART_HEIGHT };
  const { innerWidth, innerHeight } = useChartInner(size);
  const monthLabels = months.map(formatStudioHomeMonthLabel);
  const yMax = computeYMax(series.flatMap((item) => item.values));

  function pointAt(index: number, value: number) {
    const x =
      CHART_PADDING.left +
      (months.length <= 1 ? innerWidth / 2 : (index / (months.length - 1)) * innerWidth);
    const y = CHART_PADDING.top + innerHeight - (value / yMax) * innerHeight;
    return { x, y };
  }

  const baselineY = CHART_PADDING.top + innerHeight;

  return (
    <ChartFrame size={size} yMax={yMax} monthLabels={monthLabels}>
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
            <stop offset="0%" stopColor={item.color} stopOpacity="0.28" />
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
            />
            {points.map((point, index) => (
              <circle
                key={`${item.key}-${index}`}
                cx={point.x}
                cy={point.y}
                r={4}
                fill={item.color}
                stroke="rgb(9 9 11)"
                strokeWidth={2}
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
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
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
