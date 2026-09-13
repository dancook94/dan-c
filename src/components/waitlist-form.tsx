"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Please try again in a moment.");
        return;
      }

      setStatus("success");
      setMessage("You are on the list. We will write when the course opens.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("The waitlist is temporarily unavailable. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg">
      <label htmlFor="waitlist-email" className="text-sm font-medium text-ink">
        Email address
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-12 flex-1 rounded-md border border-border bg-surface px-4 text-ink outline-none ring-accent placeholder:text-ink-muted focus:ring-2"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-12 rounded-md bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-70"
        >
          {status === "submitting" ? "Joining…" : "Join the waitlist"}
        </button>
      </div>
      {message ? (
        <p
          role="status"
          className={`mt-3 text-sm ${
            status === "error" ? "text-negative" : "text-positive"
          }`}
        >
          {message}
        </p>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          No marketing drip. One note when enrolment opens.
        </p>
      )}
    </form>
  );
}
