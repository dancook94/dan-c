"use client";

import { useMemo, useState } from "react";
import type { CryptoForwardSide } from "@/lib/crypto-forward";
import { formatCryptoPrice, formatCryptoQty, formatUsdt } from "@/lib/format";

const PAGE_SIZE = 10;

export type CryptoForwardTradeRow = {
  date: string;
  line: string;
  lineName: string;
  symbol: string;
  side: CryptoForwardSide;
  qty: number;
  price: number;
  cost: number;
};

function formatFill(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function CryptoForwardTrades({
  trades,
  filters,
  emptyMessage,
}: {
  trades: CryptoForwardTradeRow[];
  filters: Array<{ id: string; label: string }>;
  emptyMessage: string;
}) {
  const [line, setLine] = useState("all");
  const [page, setPage] = useState(1);

  const ordered = useMemo(() => {
    return trades
      .map((trade, index) => ({ trade, index }))
      .sort((a, b) => {
        const byDate = b.trade.date.localeCompare(a.trade.date);
        if (byDate !== 0) return byDate;
        return b.index - a.index;
      })
      .map((item) => item.trade);
  }, [trades]);

  const filtered = useMemo(() => {
    if (line === "all") return ordered;
    return ordered.filter((trade) => trade.line === line);
  }, [line, ordered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Fills</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {trades.length === 0
              ? "No fills posted"
              : `${new Intl.NumberFormat("en-GB").format(trades.length)} paper fills, 0.15% cost each`}
          </p>
        </div>
        {filters.length > 1 ? (
          <div
            className="flex flex-wrap gap-1 rounded-pill border border-border bg-bg p-1"
            role="group"
            aria-label="Filter fills by book"
          >
            {filters.map((item) => {
              const active = item.id === line;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setLine(item.id);
                    setPage(1);
                  }}
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
                    active ? "bg-accent text-white" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-bg text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">Time (UTC)</th>
              <th className="px-5 py-3 font-medium">Book</th>
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Side</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-muted">
                  {trades.length === 0 ? emptyMessage : "No fills for this book."}
                </td>
              </tr>
            ) : (
              slice.map((trade, index) => (
                <tr
                  key={`${trade.date}-${trade.line}-${trade.symbol}-${trade.side}-${index}`}
                  className="border-t border-border"
                >
                  <td className="px-5 py-3 whitespace-nowrap text-ink-muted">
                    {formatFill(trade.date)}
                  </td>
                  <td className="px-5 py-3">{trade.lineName}</td>
                  <td className="px-5 py-3 font-mono text-xs">{trade.symbol}</td>
                  <td
                    className={`px-5 py-3 font-medium ${
                      trade.side === "SELL" ? "text-negative" : "text-ink"
                    }`}
                  >
                    {trade.side}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{formatCryptoQty(trade.qty)}</td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatCryptoPrice(trade.price)}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{formatUsdt(trade.cost, 4)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-ink-muted">
        <p>
          {filtered.length === 0
            ? "0 fills"
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
