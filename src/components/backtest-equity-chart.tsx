"use client";

import { useMemo } from "react";
import { formatMoney, formatPercent, formatSignedPercent } from "@/lib/format";
import type { EquityAnnotation, EquityPoint } from "@/lib/backtesting";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function parsePointDate(iso: string) {
  return new Date(iso.includes("T") ? iso : `${iso}T00:00:00Z`);
}

function formatAxisDate(iso: string) {
  return iso.slice(0, 4);
}

function formatDayTick(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parsePointDate(iso));
}

function formatTooltipDate(iso: string) {
  const hasTime = iso.includes("T");
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: hasTime ? "short" : undefined,
    timeZone: "UTC",
  }).format(parsePointDate(iso));
}

function dayTicks(points: EquityPoint[]) {
  if (points.length <= 6) return points.map((point) => point.date);
  const indexes = new Set<number>([0, points.length - 1]);
  const steps = 4;
  for (let step = 1; step < steps; step += 1) {
    indexes.add(Math.round((step * (points.length - 1)) / steps));
  }
  return [...indexes]
    .sort((a, b) => a - b)
    .map((index) => points[index]?.date)
    .filter((date): date is string => Boolean(date));
}

function formatCompactMoney(value: number) {
  return `£${new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function BacktestEquityChart({
  points,
  annotations,
  caption,
  badge = "Illustrative reconstruction",
  emptyLabel = "Daily series pending",
  title = "Historical equity curve",
  seriesLabel = "Account equity (GBP)",
  axis = "year",
  yDomain = ["dataMin - 800", "dataMax + 1200"],
}: {
  points: EquityPoint[];
  annotations: EquityAnnotation[];
  caption: string;
  badge?: string;
  emptyLabel?: string;
  title?: string;
  seriesLabel?: string;
  axis?: "year" | "day";
  yDomain?: [number | string, number | string];
}) {
  const hasPath = points.length >= 2;
  const { ticks, maxDd, inSample, maxDdPoint } = useMemo(() => {
    const yearTicks = points
      .filter(
        (point, index, arr) =>
          index === 0 ||
          point.date.slice(0, 4) !== arr[index - 1]?.date.slice(0, 4),
      )
      .map((point) => point.date);
    const maxDrawdown = annotations.find((item) => item.type === "max_drawdown");
    const sampleEnd = annotations.find((item) => item.type === "in_sample_end");
    return {
      ticks: axis === "day" ? dayTicks(points) : yearTicks,
      maxDd: maxDrawdown,
      inSample: sampleEnd,
      maxDdPoint: maxDrawdown
        ? points.find((point) => point.date === maxDrawdown.date)
        : undefined,
    };
  }, [annotations, axis, points]);

  return (
    <figure className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <figcaption className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="text-xs text-ink-muted">{seriesLabel}</p>
        </div>
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {badge}
        </p>
      </figcaption>

      <div className="relative h-[320px] w-full sm:h-[360px]">
        {hasPath ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 28, right: 12, bottom: 0, left: 8 }}
          >
            <CartesianGrid stroke="var(--dc-border)" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={axis === "day" ? formatDayTick : formatAxisDate}
              tick={{ fill: "var(--dc-ink-muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--dc-border)" }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              dataKey="equity"
              tickFormatter={(value: number) => formatCompactMoney(value)}
              tick={{ fill: "var(--dc-ink-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={64}
              domain={yDomain}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length || typeof label !== "string") {
                  return null;
                }
                const equity = Number(payload[0]?.value);
                const dd = Number(payload[0]?.payload?.drawdownPct);
                return (
                  <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-card">
                    <p className="font-medium text-ink">
                      {formatTooltipDate(label)}
                    </p>
                    <p className="mt-1 tabular-nums text-ink">
                      {formatMoney(equity, "GBP")}
                    </p>
                    <p className="tabular-nums text-ink-muted">
                      Drawdown {formatPercent(dd)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="var(--dc-accent)"
              strokeWidth={2}
              fill="var(--dc-accent-soft)"
              fillOpacity={0.55}
              dot={false}
              isAnimationActive={false}
            />
            {inSample ? (
              <ReferenceLine
                x={inSample.date}
                stroke="var(--dc-ink-muted)"
                strokeDasharray="4 4"
                label={{
                  value: "End-2023 in-sample",
                  position: "insideTopRight",
                  fill: "var(--dc-ink-muted)",
                  fontSize: 11,
                }}
              />
            ) : null}
            {maxDd && maxDdPoint ? (
              <ReferenceDot
                x={maxDdPoint.date}
                y={maxDdPoint.equity}
                r={5}
                fill="var(--dc-negative)"
                stroke="var(--dc-surface)"
                strokeWidth={2}
                label={{
                  value: `Max DD ${formatSignedPercent(maxDd.value)}`,
                  position: "bottom",
                  fill: "var(--dc-negative)",
                  fontSize: 11,
                }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border bg-bg">
            <p className="rounded-pill bg-surface px-3 py-1 text-sm font-medium text-ink-muted">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-ink-muted">{caption}</p>
    </figure>
  );
}
