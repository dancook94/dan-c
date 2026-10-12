"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUsdt } from "@/lib/format";

export type CryptoForwardChartSeries = {
  id: string;
  name: string;
  benchmark: boolean;
  points: Array<{ date: string; equity: number }>;
};

const LINE_STROKES = [
  "var(--dc-accent)",
  "var(--dc-ink)",
  "var(--dc-accent-hover)",
  "#0369A1",
] as const;

const BENCH_STROKES = ["var(--dc-ink-muted)", "#94A3B8", "#78716C"] as const;

function parsePointDate(iso: string) {
  return new Date(iso.includes("T") ? iso : `${iso}T00:00:00Z`);
}

function formatDayTick(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(parsePointDate(iso));
}

function formatTooltipDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsePointDate(iso));
}

function dayTicks(dates: string[]) {
  if (dates.length <= 6) return dates;
  const indexes = new Set<number>([0, dates.length - 1]);
  const steps = 4;
  for (let step = 1; step < steps; step += 1) {
    indexes.add(Math.round((step * (dates.length - 1)) / steps));
  }
  return [...indexes]
    .sort((a, b) => a - b)
    .map((index) => dates[index])
    .filter((date): date is string => Boolean(date));
}

function formatAxis(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value);
}

export function CryptoForwardChart({
  series,
  caption,
  emptyLabel = "No equity snapshots yet",
}: {
  series: CryptoForwardChartSeries[];
  caption: string;
  emptyLabel?: string;
}) {
  const model = useMemo(() => {
    const byDate = series.map(
      (item) => new Map(item.points.map((point) => [point.date, point.equity])),
    );
    const dates = [
      ...new Set(series.flatMap((item) => item.points.map((point) => point.date))),
    ].sort((a, b) => a.localeCompare(b));
    const rows = dates.map((date) => {
      const row: Record<string, string | number | null> = { date };
      series.forEach((item, index) => {
        row[item.id] = byDate[index]?.get(date) ?? null;
      });
      return row;
    });
    const values = series.flatMap((item) => item.points.map((point) => point.equity));
    let domain: [number, number] = [0, 1];
    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const span = max - min;
      const pad = span === 0 ? Math.max(Math.abs(max) * 0.02, 50) : span * 0.12;
      domain = [min - pad, max + pad];
    }
    let lineIndex = 0;
    let benchIndex = 0;
    const styled = series.map((item) => {
      const stroke = item.benchmark
        ? BENCH_STROKES[benchIndex++ % BENCH_STROKES.length]
        : LINE_STROKES[lineIndex++ % LINE_STROKES.length];
      return { ...item, stroke };
    });
    return { dates, rows, domain, styled, hasPath: dates.length > 0 };
  }, [series]);

  return (
    <figure className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <figcaption className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Paper equity curves</h2>
          <p className="text-xs text-ink-muted">USDT, marked at the daily close</p>
        </div>
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          Paper forward test
        </p>
      </figcaption>

      <div className="relative h-[320px] w-full sm:h-[380px]">
        {model.hasPath ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={model.rows}
              margin={{ top: 12, right: 12, bottom: 0, left: 8 }}
            >
              <CartesianGrid stroke="var(--dc-border)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={dayTicks(model.dates)}
                tickFormatter={formatDayTick}
                tick={{ fill: "var(--dc-ink-muted)", fontSize: 11 }}
                axisLine={{ stroke: "var(--dc-border)" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                domain={model.domain}
                tickFormatter={(value: number) => formatAxis(value)}
                tick={{ fill: "var(--dc-ink-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || typeof label !== "string") {
                    return null;
                  }
                  return (
                    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-card">
                      <p className="font-medium text-ink">{formatTooltipDate(label)}</p>
                      <ul className="mt-1 space-y-0.5">
                        {payload.map((item) => {
                          const value = Number(item.value);
                          if (!Number.isFinite(value)) return null;
                          return (
                            <li
                              key={String(item.dataKey)}
                              className="flex items-center justify-between gap-4 tabular-nums text-ink"
                            >
                              <span className="text-ink-muted">{item.name}</span>
                              <span>{formatUsdt(value)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }}
              />
              {model.styled.map((item) => (
                <Line
                  key={item.id}
                  type="monotone"
                  dataKey={item.id}
                  name={item.name}
                  stroke={item.stroke}
                  strokeWidth={item.benchmark ? 1.75 : 2.25}
                  strokeDasharray={item.benchmark ? "5 4" : undefined}
                  dot={model.dates.length < 3}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border bg-bg">
            <p className="max-w-sm px-6 text-center text-sm font-medium text-ink-muted">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>

      {model.hasPath ? (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Chart series">
          {model.styled.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 text-xs text-ink-muted"
            >
              <svg width="28" height="8" aria-hidden className="shrink-0">
                <line
                  x1="0"
                  y1="4"
                  x2="28"
                  y2="4"
                  stroke={item.stroke}
                  strokeWidth="2"
                  strokeDasharray={item.benchmark ? "4 3" : undefined}
                />
              </svg>
              <span>
                {item.name}
                {item.benchmark ? " (benchmark)" : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-ink-muted">{caption}</p>
    </figure>
  );
}
