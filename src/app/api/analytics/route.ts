import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics/trackEvent";

export async function POST(request: Request) {
  const body = await request.json();
  const { eventType, userId, listingId, categoryId, metadata } = body;

  if (!eventType) {
    return NextResponse.json({ error: "eventType required" }, { status: 400 });
  }

  await trackEvent({ eventType, userId, listingId, categoryId, metadata });
  return NextResponse.json({ ok: true });
}
