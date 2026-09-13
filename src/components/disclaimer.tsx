import Link from "next/link";

export const SHORT_DISCLAIMER =
  "Trading forex involves risk. Past performance is not indicative of future results. dan-c.co.uk is for informational purposes only and does not constitute financial advice.";

export function Disclaimer({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <p
      className={`rounded-md bg-disclaimer-bg px-5 py-3.5 text-[0.8125rem] leading-6 text-disclaimer-ink ${className}`}
    >
      {SHORT_DISCLAIMER}{" "}
      {compact ? null : (
        <Link
          href="/about#risk-disclosure"
          className="font-medium text-ink-muted underline decoration-border underline-offset-2 hover:text-ink"
        >
          Read the full risk disclosure
        </Link>
      )}
    </p>
  );
}

export function PerformanceNote() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-disclaimer-bg px-5 py-4 text-sm leading-6 text-ink-muted sm:flex-row sm:items-start sm:justify-between">
      <p>
        Past performance is not a reliable indicator of future results. Trading
        involves risk of loss.
      </p>
      <Link
        href="/about#risk-disclosure"
        className="shrink-0 font-medium text-accent hover:text-accent-hover"
      >
        Read our risk disclosure →
      </Link>
    </div>
  );
}
