"use client";

import { useId, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  date: string;
  value: number;
};

type ChartKind = "equity" | "drawdown";

function formatAxisDate(date: string) {
  const year = date.slice(0, 4);
  const month = date.slice(5, 7);
  if (month === "01") return year;
  return "";
}

function formatTooltipDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatEquity(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDrawdown(value: number) {
  return `${value.toFixed(1)}%`;
}

export function BacktestChart({
  title,
  caption,
  yLabel,
  points,
  kind,
  emptyLabel = "No series yet",
}: {
  title: string;
  caption: string;
  yLabel: string;
  points: Point[];
  kind: ChartKind;
  emptyLabel?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<Point | null>(null);
  const stroke = kind === "drawdown" ? "var(--dc-negative)" : "var(--dc-accent)";
  const fill = kind === "drawdown" ? "var(--dc-negative-soft)" : "var(--dc-accent-soft)";
  const hasData = points.length >= 2;
  const data = useMemo(
    () => points.map((point) => ({ ...point })),
    [points],
  );

  const active = hover ?? (hasData ? points[points.length - 1] : null);

  return (
    <figure className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <figcaption className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="text-xs text-ink-muted">{yLabel}</p>
        </div>
        <div className="text-left sm:text-right">
          {active ? (
            <p className="font-mono text-sm font-semibold tabular-nums text-ink">
              {kind === "drawdown"
                ? formatDrawdown(active.value)
                : formatEquity(active.value)}
            </p>
          ) : null}
          <p className="text-xs text-ink-muted">
            {active ? formatTooltipDate(active.date) : caption}
          </p>
        </div>
      </figcaption>
      <div className="h-56 w-full sm:h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 4 }}
              onMouseMove={(state) => {
                const index = Number(state.activeIndex);
                if (Number.isInteger(index) && data[index]) {
                  setHover(data[index]);
                }
              }}
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={fill} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--dc-border)"
                strokeDasharray="0"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fill: "var(--dc-ink-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value: number) =>
                  kind === "drawdown"
                    ? `${value.toFixed(0)}%`
                    : new Intl.NumberFormat("en-GB", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                }
                tick={{ fill: "var(--dc-ink-muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                domain={
                  kind === "drawdown" ? ["dataMin", 0] : ["auto", "auto"]
                }
              />
              <Tooltip
                cursor={{ stroke: "var(--dc-border)", strokeWidth: 1 }}
                content={({ active: tipActive, payload, label }) => {
                  if (!tipActive || !payload?.[0] || typeof label !== "string") {
                    return null;
                  }
                  const value = Number(payload[0].value);
                  return (
                    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-card">
                      <p className="text-ink-muted">{formatTooltipDate(label)}</p>
                      <p className="mt-1 font-semibold tabular-nums text-ink">
                        {kind === "drawdown"
                          ? formatDrawdown(value)
                          : formatEquity(value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={stroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: stroke }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-pill bg-bg px-3 py-1 text-sm font-medium text-ink-muted">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-muted">{caption}</p>
    </figure>
  );
}
