const RANGES = ["30D", "90D", "YTD", "All"] as const;

export function RangePills({
  active = "All",
  disabled = true,
}: {
  active?: (typeof RANGES)[number];
  disabled?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap gap-1 rounded-pill border border-border bg-surface p-1"
      role="group"
      aria-label="Date range"
    >
      {RANGES.map((range) => {
        const isActive = range === active;
        return (
          <button
            key={range}
            type="button"
            disabled={disabled && !isActive}
            title={
              disabled
                ? "Ranges become available when the live track record is published"
                : undefined
            }
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
              isActive
                ? "bg-accent text-white"
                : "text-ink-muted"
            } disabled:cursor-not-allowed`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
