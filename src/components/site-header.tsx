"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/container";
import { Wordmark } from "@/components/wordmark";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/results", label: "Results" },
  { href: "/backtesting", label: "Backtesting" },
  { href: "/backtesting/dual-momentum", label: "Dual momentum" },
  { href: "/method", label: "Method" },
  { href: "/course", label: "Course" },
  { href: "/about", label: "About" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/backtesting") {
    return pathname === "/backtesting";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Wordmark />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-0.5 lg:flex"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <span
                  className={`border-b-2 pb-1 ${
                    active ? "border-accent" : "border-transparent"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/results"
            className="rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            View results
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-ink lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="flex flex-col gap-1.5">
            <span
              className={`block h-0.5 w-4 bg-ink transition ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-4 bg-ink transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-4 bg-ink transition ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </Container>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-surface lg:hidden"
        >
          <Container className="flex flex-col py-3">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-2 py-3 text-base font-medium ${
                    active ? "text-accent" : "text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </Container>
        </div>
      ) : null}
    </header>
  );
}
