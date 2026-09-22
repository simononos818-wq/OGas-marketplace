// POST /api/otp/send  { phone: "08133110237", purpose: "login" | "checkout" }
// Rate limits: 1 send / 60s per phone, max 6 sends / hour per phone.
import { NextResponse } from "next/server";
import { sendOtp, toE164Ng } from "@/lib/termii";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { phone, purpose = "login" } = await req.json();
    const to = toE164Ng(String(phone ?? ""));
    if (!to) {
      return NextResponse.json({ ok: false, error: "Enter a valid Nigerian phone number." }, { status: 400 });
    }
    if (!["login", "checkout"].includes(purpose)) {
      return NextResponse.json({ ok: false, error: "Bad purpose." }, { status: 400 });
    }

    const since60s = new Date(Date.now() - 60_000);
    const since1h = new Date(Date.now() - 3_600_000);
    const recent = await adminDb
      .collection("otps")
      .where("phone", "==", to)
      .where("createdAt", ">=", since1h)
      .get();

    if (recent.docs.some((d) => (d.data().createdAt?.toDate?.() ?? new Date(0)) >= since60s)) {
      return NextResponse.json({ ok: false, error: "Please wait a minute, then tap Resend." }, { status: 429 });
    }
    if (recent.size >= 6) {
      return NextResponse.json({ ok: false, error: "Too many codes sent. Try again in an hour." }, { status: 429 });
    }

    const data = await sendOtp(to, purpose);

    await adminDb.collection("otps").add({
      phone: to,
      purpose,
      pinId: data.pin_id,
      verified: false,
      attempts: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    // Never return pin_id or the code to the client.
    return NextResponse.json({ ok: true, message: "Code sent." });
  } catch (e) {
    console.error("otp/send:", e);
    return NextResponse.json({ ok: false, error: "Could not send code. Try again." }, { status: 500 });
  }
}
