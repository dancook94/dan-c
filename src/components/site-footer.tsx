import Link from "next/link";
import { Container } from "@/components/container";
import { Disclaimer } from "@/components/disclaimer";
import { Wordmark } from "@/components/wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container className="py-8">
        <Disclaimer />
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Wordmark />
            <p className="mt-2 max-w-sm text-sm text-ink-muted">
              A systematic forex day-trading method, published from the United
              Kingdom. Not a broker. Not financial advice.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/results" className="text-ink-muted hover:text-ink">
              Results
            </Link>
            <Link href="/backtesting" className="text-ink-muted hover:text-ink">
              Backtesting
            </Link>
            <Link
              href="/backtesting/dual-momentum"
              className="text-ink-muted hover:text-ink"
            >
              Dual momentum
            </Link>
            <Link href="/method" className="text-ink-muted hover:text-ink">
              Method
            </Link>
            <Link href="/course" className="text-ink-muted hover:text-ink">
              Course
            </Link>
            <Link href="/about" className="text-ink-muted hover:text-ink">
              About
            </Link>
            <Link
              href="/about#risk-disclosure"
              className="text-ink-muted hover:text-ink"
            >
              Risk disclosure
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-disclaimer-ink">
          © {new Date().getFullYear()} dan-c · United Kingdom
        </p>
      </Container>
    </footer>
  );
}
