import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";

export const metadata: Metadata = {
  title: "Method",
  description:
    "Opening-range breakout version 1 in plain English: markets, session, and risk. Not a signal feed.",
};

export default function MethodPage() {
  return (
    <div className="pb-16">
      <Container className="max-w-3xl pt-10 sm:pt-14">
        <p className="text-sm font-medium text-accent">Opening-range breakout · v1</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          The method, in plain English
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          Version 1 is a written set of rules. The robot does not invent setups,
          and this page does not dump signals. If the conditions are not there,
          it stands aside.
        </p>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-ink">Markets</h2>
          <p className="mt-3 text-ink-muted">
            Liquid FX majors only. The book is built around pairs that trade
            cleanly through the London morning — not exotics, not overnight
            carry, not a scatter of instruments. Fewer markets, same rules,
            every session.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">The session</h2>
          <p className="mt-3 text-ink-muted">
            London cash hours are the working window. Version 1 measures an
            opening range in the first minutes of that session, then waits to
            see whether price leaves the box with acceptance rather than a
            one-tick spike. A range that is too wide, or a break that is messy,
            is a no-trade. There is at most one sequence per session.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">How a trade is defined</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-ink-muted">
            <li>Mark the high and low of the opening window.</li>
            <li>
              Wait for price to leave that range and hold — not a flicker
              through the line.
            </li>
            <li>
              Enter with the break. The stop lives on the other side of the
              range, or a defined fraction of it.
            </li>
            <li>
              The target is set before the order is sent. The goalposts do not
              move mid-trade.
            </li>
            <li>Done for the day after that sequence, win or lose.</li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">Risk</h2>
          <p className="mt-3 text-ink-muted">
            Risk is sized before anything hits the market. A losing day has a
            hard stop: the robot is finished. Version 1 does not average into a
            loser, does not run overnight inventory, and does not increase size
            to “get back” a loss. Conservative risk control is the product, not
            a slogan.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-ink">What this page is not</h2>
          <p className="mt-3 text-ink-muted">
            It is not a signal service, not a trade-by-trade dump, and not an
            invitation to copy the rules with real money. The public track
            record — when it is published on{" "}
            <Link href="/results" className="font-medium text-accent hover:text-accent-hover">
              Results
            </Link>
            — is the evidence, not the prose.
          </p>
        </section>
      </Container>
    </div>
  );
}
