import Link from "next/link";
import type { BacktestArchiveBook } from "@/lib/backtesting";
import {
  BACKTEST_ARCHIVE_RULE,
  BACKTEST_ARCHIVE_THRESHOLD_CAGR_PCT,
} from "@/lib/backtesting-archive";
import { formatSignedPercent } from "@/lib/format";

export function ResearchArchive({
  rule = BACKTEST_ARCHIVE_RULE,
  books,
  currentHref,
}: {
  rule?: string;
  books: BacktestArchiveBook[];
  currentHref: string;
}) {
  return (
    <section
      aria-label="Research archive"
      className="rounded-lg border border-border bg-surface px-5 py-5 shadow-card sm:px-6"
    >
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">
        Research archive (≥{BACKTEST_ARCHIVE_THRESHOLD_CAGR_PCT}% CAGR)
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">{rule}</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {books.map((book) => {
          const current = book.href === currentHref;
          const className = current
            ? "border-accent bg-accent-soft/40"
            : "border-border bg-bg hover:border-accent/60";
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{book.title}</h3>
                <span
                  className={`shrink-0 text-xs font-semibold tracking-wide uppercase ${
                    current ? "text-accent" : "text-ink-muted"
                  }`}
                >
                  {current ? "This page" : "Open"}
                </span>
              </div>
              <p className="mt-2 text-sm tabular-nums text-ink">
                CAGR {formatSignedPercent(book.cagrPct, 1)}
                <span className="text-ink-muted"> · </span>
                <span className="text-negative">
                  DD {formatSignedPercent(book.maxDrawdownPct, 0)}
                </span>
              </p>
            </>
          );

          return (
            <li key={book.slug}>
              {current ? (
                <div
                  className={`block rounded-lg border px-4 py-4 ${className}`}
                  aria-current="page"
                >
                  {inner}
                </div>
              ) : (
                <Link
                  href={book.href}
                  className={`block rounded-lg border px-4 py-4 transition-colors ${className}`}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
