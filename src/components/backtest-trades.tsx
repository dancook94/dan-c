"use client";

import { useMemo, useState } from "react";
import { formatMoney, formatNumber } from "@/lib/format";
import { MARKET_FILTERS, type BacktestTrade } from "@/lib/backtesting";

const PAGE_SIZE = 10;

function formatClosed(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function BacktestTrades({
  trades,
  sample,
  fullTradeCount,
  note,
  howToReplace,
  marketFilters = MARKET_FILTERS,
  dataFile = "public/data/backtesting/trades.json",
}: {
  trades: BacktestTrade[];
  sample: boolean;
  fullTradeCount: number;
  note: string;
  howToReplace: string;
  marketFilters?: readonly string[];
  dataFile?: string;
}) {
  const [market, setMarket] = useState("All");
  const [page, setPage] = useState(1);
  const showNotes = trades.some((trade) => Boolean(trade.notes));

  const filtered = useMemo(() => {
    if (market === "All") return trades;
    return trades.filter((trade) => trade.market === market);
  }, [market, trades]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Trade log</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {sample
              ? `SAMPLE · ${trades.length} labelled rows of ${new Intl.NumberFormat("en-GB").format(fullTradeCount)} research trades`
              : `${new Intl.NumberFormat("en-GB").format(trades.length)} closed trades`}
          </p>
        </div>
        <div
          className="flex flex-wrap gap-1 rounded-pill border border-border bg-bg p-1"
          role="group"
          aria-label="Filter trades by market"
        >
          {marketFilters.map((item) => {
            const active = item === market;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMarket(item);
                  setPage(1);
                }}
                className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
                  active ? "bg-accent text-white" : "text-ink-muted hover:text-ink"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {sample ? (
        <p className="border-b border-border bg-accent-soft/60 px-5 py-3 text-xs leading-5 text-ink-muted">
          {note} Drop a full <code className="font-mono">trades.json</code> later
          — {howToReplace}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Closed</th>
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Market</th>
              <th className="px-5 py-3 font-medium">Side</th>
              <th className="px-5 py-3 font-medium">P&amp;L</th>
              <th className="px-5 py-3 font-medium">R</th>
              {showNotes ? (
                <th className="px-5 py-3 font-medium">Notes</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td
                  colSpan={showNotes ? 7 : 6}
                  className="px-5 py-10 text-center text-ink-muted"
                >
                  No trades in this view. Add rows to{" "}
                  <code className="font-mono text-xs">{dataFile}</code>
                  .
                </td>
              </tr>
            ) : (
              slice.map((trade) => {
                const negative = trade.pnl < 0;
                return (
                  <tr key={trade.id} className="border-t border-border">
                    <td className="px-5 py-3 text-ink-muted">
                      {formatClosed(trade.closedAt)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">
                      {trade.id}
                      {trade.sample || sample ? (
                        <span className="ml-2 rounded-pill bg-bg px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-ink-muted uppercase">
                          Sample
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">{trade.market}</td>
                    <td className="px-5 py-3 capitalize">{trade.side}</td>
                    <td
                      className={`px-5 py-3 tabular-nums ${
                        negative
                          ? "bg-negative-soft text-negative"
                          : "bg-positive-soft text-positive"
                      }`}
                    >
                      {formatMoney(trade.pnl, "GBP")}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums">
                      {formatNumber(trade.rMultiple, 2)}
                    </td>
                    {showNotes ? (
                      <td className="px-5 py-3 text-xs text-ink-muted">
                        {trade.notes ?? "—"}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-ink-muted">
        <p>
          {filtered.length === 0
            ? "0 trades"
            : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-2.5 py-1 font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span className="tabular-nums">
            {safePage} / {pageCount}
          </span>
          <button
            type="button"
            className="rounded-md border border-border px-2.5 py-1 font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40"
            disabled={safePage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
