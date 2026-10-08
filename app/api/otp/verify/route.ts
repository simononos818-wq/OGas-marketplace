// POST /api/otp/verify  { phone: "08133110237", pin: "123456" }
// Finds the phone's latest unverified OTP, max 3 attempts, marks user verified.
// On success returns a Firebase custom token so the client can sign in
// without relying on Firebase's own SMS (which is unreliable for NG numbers).
import { NextResponse } from "next/server";
import { verifyOtp, toE164Ng } from "@/lib/termii";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { phone, pin } = await req.json();
    const to = toE164Ng(String(phone ?? ""));
    const code = String(pin ?? "").trim();
    if (!to || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });
    }

    const snap = await adminDb
      .collection("otps")
      .where("phone", "==", to)
      .where("verified", "==", false)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: false, error: "No code found. Tap Resend." }, { status: 400 });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.expiresAt?.toDate?.() < new Date()) {
      return NextResponse.json({ ok: false, error: "Code expired. Tap Resend." }, { status: 400 });
    }
    if (data.attempts >= 3) {
      return NextResponse.json({ ok: false, error: "Too many tries. Tap Resend for a new code." }, { status: 429 });
    }

    let result: Record<string, any>;
    try {
      result = await verifyOtp(data.pinId, code);
    } catch {
      result = { verified: false };
    }

    if (result.verified !== "true" && result.verified !== true) {
      await doc.ref.update({ attempts: FieldValue.increment(1) });
      const left = 2 - (data.attempts ?? 0);
      return NextResponse.json(
        { ok: false, error: left > 0 ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Wrong code." },
        { status: 400 }
      );
    }

    await doc.ref.update({ verified: true, verifiedAt: new Date() });

    // Stable Firebase UID keyed to the phone number, so repeat logins land
    // on the same account regardless of which OTP channel was used.
    const uid = `tel_${to}`;
    await adminDb.collection("users").doc(uid).set(
      { phone: to, phoneVerified: true, verifiedAt: new Date() },
      { merge: true }
    );

    const token = await adminAuth.createCustomToken(uid, { phone: to });

    return NextResponse.json({ ok: true, token, uid });
  } catch (e) {
    console.error("otp/verify:", e);
    return NextResponse.json({ ok: false, error: "Could not check code. Try again." }, { status: 500 });
  }
}
