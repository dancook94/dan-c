"use client";

import { useMemo, useState } from "react";
import { BACKTEST_MARKETS, type BacktestTrade } from "@/lib/backtesting-data";
import { formatMoney, formatNumber } from "@/lib/format";
import type { ResultsCurrency } from "@/lib/results";

const PAGE_SIZE = 25;

function formatClosed(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export function BacktestTrades({
  trades,
  currency,
}: {
  trades: BacktestTrade[];
  currency: ResultsCurrency;
}) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return trades.filter((trade) => {
      if (market !== "all" && trade.market !== market) return false;
      if (!needle) return true;
      const hay = `${trade.id} ${trade.market} ${trade.side}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [trades, query, market]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Full trades</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {trades.length === 0
              ? "Empty until the fxday export is dropped into data/backtesting/trades.json."
              : `${filtered.length.toLocaleString("en-GB")} of ${trades.length.toLocaleString("en-GB")} trades`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            Market
            <select
              value={market}
              onChange={(event) => {
                setMarket(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink"
            >
              <option value="all">All markets</option>
              {BACKTEST_MARKETS.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            Search
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="ID, market, side"
              className="h-10 rounded-md border border-border bg-bg px-3 text-sm text-ink"
            />
          </label>
        </div>
      </div>
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
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-ink-muted"
                >
                  No backtest fills to show. When Trading Ted or fxday drops a
                  real <code className="font-mono text-xs">trades.json</code>,
                  this table fills automatically. Individual trades are never
                  invented for the marketing site.
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
                    <td className="px-5 py-3 font-mono text-xs">{trade.id}</td>
                    <td className="px-5 py-3">{trade.market}</td>
                    <td className="px-5 py-3 capitalize">{trade.side}</td>
                    <td
                      className={`px-5 py-3 tabular-nums ${
                        negative
                          ? "bg-negative-soft text-negative"
                          : "bg-positive-soft text-positive"
                      }`}
                    >
                      {formatMoney(trade.pnl, currency)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums">
                      {formatNumber(trade.rMultiple, 2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
          <p className="text-ink-muted">
            Page {safePage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-ink disabled:text-ink-muted"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-ink disabled:text-ink-muted"
              disabled={safePage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
