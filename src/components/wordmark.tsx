import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`text-[1.35rem] font-semibold tracking-tight text-ink ${className}`}
      aria-label="dan-c home"
    >
      dan<span className="text-accent">-</span>c
    </Link>
  );
}
