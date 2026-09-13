import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Disclaimer } from "@/components/disclaimer";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Course",
  description:
    "Join the waitlist for a practical course on building a trading robot from a written method.",
};

export default function CoursePage() {
  return (
    <div className="pb-16">
      <Container className="max-w-3xl pt-10 sm:pt-14">
        <p className="text-sm font-medium text-accent">Waitlist</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Build a trading robot
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          A practical course on taking a written method — opening range,
          session, risk — and turning it into systematic execution. Less
          folklore, more specification, testing, and operational hygiene.
        </p>

        <ul className="mt-8 space-y-3 text-ink-muted">
          <li>Write rules so a machine can follow them without you in the chair.</li>
          <li>Size risk before the order, and stop for the day when you should.</li>
          <li>Keep a track record you would be willing to publish.</li>
        </ul>

        <WaitlistForm />
        <Disclaimer className="mt-12" />
      </Container>
    </div>
  );
}
