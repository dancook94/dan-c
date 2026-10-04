import { NextResponse } from "next/server";
import { loadForwardTestSummary } from "@/lib/forward-test-store";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const summary = await loadForwardTestSummary();
  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
    },
  });
}
