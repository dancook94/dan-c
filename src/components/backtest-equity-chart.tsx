"use client";

import { useMemo } from "react";
import { formatMoney, formatPercent } from "@/lib/format";
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

function formatAxisDate(iso: string) {
  return iso.slice(0, 4);
}

function formatTooltipDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
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
}: {
  points: EquityPoint[];
  annotations: EquityAnnotation[];
  caption: string;
}) {
  const { yearTicks, maxDd, inSample, maxDdPoint } = useMemo(() => {
    const ticks = points
      .filter(
        (point, index, arr) =>
          index === 0 ||
          point.date.slice(0, 4) !== arr[index - 1]?.date.slice(0, 4),
      )
      .map((point) => point.date);
    const maxDrawdown = annotations.find((item) => item.type === "max_drawdown");
    const sampleEnd = annotations.find((item) => item.type === "in_sample_end");
    return {
      yearTicks: ticks,
      maxDd: maxDrawdown,
      inSample: sampleEnd,
      maxDdPoint: maxDrawdown
        ? points.find((point) => point.date === maxDrawdown.date)
        : undefined,
    };
  }, [annotations, points]);

  return (
    <figure className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <figcaption className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Historical equity curve
          </h2>
          <p className="text-xs text-ink-muted">Account equity (GBP)</p>
        </div>
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          Illustrative reconstruction
        </p>
      </figcaption>

      <div className="h-[320px] w-full sm:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ top: 28, right: 12, bottom: 0, left: 8 }}
          >
            <CartesianGrid stroke="var(--dc-border)" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={yearTicks}
              tickFormatter={formatAxisDate}
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
              domain={["dataMin - 800", "dataMax + 1200"]}
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
                  value: "Max DD −21.3%",
                  position: "bottom",
                  fill: "var(--dc-negative)",
                  fontSize: 11,
                }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs leading-5 text-ink-muted">{caption}</p>
    </figure>
  );
}
