// Receives Termii event callbacks (delivery receipts, inbound messages).
// Logs everything to Firestore `messageLog` for the audit trail.
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    await adminDb.collection("messageLog").add({
      type: "termii-webhook",
      payload,
      receivedAt: new Date(),
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
  } catch (e) {
    console.error("termii-webhook:", e);
  }
  // Always 200 so Termii doesn't retry-flood us.
  return NextResponse.json({ ok: true });
}
