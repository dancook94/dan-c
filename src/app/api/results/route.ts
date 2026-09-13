import { NextResponse } from "next/server";
import { loadResults } from "@/lib/results";

export async function GET() {
  const results = await loadResults();
  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
