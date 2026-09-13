import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who is behind dan-c, why it is UK-based, and why this site is not financial advice.",
};

export default function AboutPage() {
  return (
    <div className="pb-16">
      <Container className="max-w-3xl pt-10 sm:pt-14">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          About dan-c
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          dan-c is the public home for a systematic forex day-trading method
          developed by Daniel, a professional trader based in the United
          Kingdom.
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-ink">Who</h2>
          <p className="mt-3 text-ink-muted">
            The work is research-driven and results-focused: write the rules,
            run them the same way every session, and publish the outcome when
            the live book is ready. The tone is deliberately calm. Trust is
            earned by a track record and a method you can read — not by
            promises.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">United Kingdom</h2>
          <p className="mt-3 text-ink-muted">
            The site, the method, and the operator sit in the UK. Times on the
            results pages use London. This is not a US broker shopfront and not
            an offshore signals desk.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">What this site is</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
            <li>
              A place to read the{" "}
              <Link href="/method" className="font-medium text-accent hover:text-accent-hover">
                method
              </Link>{" "}
              in plain English.
            </li>
            <li>
              A public{" "}
              <Link href="/results" className="font-medium text-accent hover:text-accent-hover">
                results
              </Link>{" "}
              page that stays empty until paper or live figures are exported.
            </li>
            <li>
              A{" "}
              <Link href="/backtesting" className="font-medium text-accent hover:text-accent-hover">
                backtesting
              </Link>{" "}
              page for the historical H4 Donchian research book. That is
              hypothetical. It is not a live track record.
            </li>
            <li>
              A{" "}
              <Link href="/course" className="font-medium text-accent hover:text-accent-hover">
                course waitlist
              </Link>{" "}
              for people who want to build a trading robot properly.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">What this site is not</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
            <li>Not a broker, and not a place to open an account.</li>
            <li>Not a signals product — that stays off the primary navigation.</li>
            <li>Not personalised investment advice, a recommendation, or a solicitation.</li>
            <li>Not a guarantee of profit. Forex can lose more than you expect, quickly.</li>
          </ul>
        </section>

        <section id="risk-disclosure" className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-semibold text-ink">Risk disclosure</h2>
          <div className="mt-4 space-y-4 text-ink-muted">
            <p>
              Trading foreign exchange on margin carries a high level of risk
              and may not be suitable for all investors. The high degree of
              leverage can work against you as well as for you. Before deciding
              to trade, you should carefully consider your investment
              objectives, level of experience, and risk appetite.
            </p>
            <p>
              There is a possibility that you may sustain a loss of some or all
              of your initial investment. You should not invest money that you
              cannot afford to lose. Past performance, whether live or
              hypothetical, is not a reliable indicator of future results.
              Paper and live figures appear only when they are exported from
              that book. The Backtesting page publishes a historical,
              hypothetical research book and must not be read as a live track
              record. Placeholders are not performance.
            </p>
            <p>
              Nothing on dan-c.co.uk is financial, investment, tax, or legal
              advice. Nothing here is an offer to buy or sell any instrument.
              If you are unsure, seek advice from an independent adviser
              authorised in your jurisdiction.
            </p>
          </div>
        </section>
      </Container>
    </div>
  );
}
