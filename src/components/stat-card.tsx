export function StatCard({
  label,
  value,
  caption = "Coming soon",
  tone = "default",
}: {
  label: string;
  value: string;
  caption?: string;
  tone?: "default" | "negative";
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
        {label}
      </p>
      <p
        className={`mt-3 text-[1.5rem] leading-tight font-semibold tracking-tight break-words tabular-nums sm:text-[1.75rem] ${
          tone === "negative" && value !== "—" ? "text-negative" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-3 text-xs text-ink-muted">{caption}</p>
    </article>
  );
}
