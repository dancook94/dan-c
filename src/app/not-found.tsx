import Link from "next/link";
import { Container } from "@/components/container";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
        This page is not here
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink-muted">
        The public site is Home, Results, Method, Course, and About. Signals
        are not on the primary navigation.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Back to home
      </Link>
    </Container>
  );
}
