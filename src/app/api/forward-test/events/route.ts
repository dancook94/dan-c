import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  authorizeForwardTest,
  forwardTestTokenConfigured,
} from "@/lib/forward-test-auth";
import {
  ForwardTestCapacityError,
  parseForwardTestEvent,
  type ForwardTestEvent,
} from "@/lib/forward-test";
import {
  ForwardTestStoreError,
  upsertForwardTestEvent,
} from "@/lib/forward-test-store";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32_000;

export async function POST(request: Request) {
  if (!forwardTestTokenConfigured()) {
    return NextResponse.json(
      { ok: false, error: "FORWARD_TEST_TOKEN is not set." },
      { status: 503 },
    );
  }

  if (!authorizeForwardTest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Payload is too large." },
      { status: 413 },
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read the request body." },
      { status: 400 },
    );
  }

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Payload is too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 },
    );
  }

  const parsed = parseForwardTestEvent(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const event: ForwardTestEvent = {
    ...parsed.event,
    receivedAt: new Date().toISOString(),
  };

  try {
    const saved = await upsertForwardTestEvent(event);
    revalidatePath("/forward-test");
    revalidatePath("/api/forward-test/summary");
    return NextResponse.json({
      ok: true,
      id: event.id,
      type: event.type,
      created: saved.created,
    });
  } catch (error) {
    if (error instanceof ForwardTestCapacityError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof ForwardTestStoreError) {
      const status =
        error.code === "unconfigured" ? 503 : error.code === "sample" ? 400 : 500;
      return NextResponse.json({ ok: false, error: error.message }, { status });
    }
    console.error(
      "forward-test write failed",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { ok: false, error: "Could not store the event." },
      { status: 500 },
    );
  }
}
