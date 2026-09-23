// app/api/walkin/route.ts
// Logs a walk-in sale to Firestore (server-side, via firebase-admin)
// and fires a thank-you SMS via Termii. If Termii env vars are missing
// or Nigeria isn't activated on the account, the sale still saves.
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

type PaymentType = "cash" | "transfer";

function normalizeNgPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^0[7-9]0\d{8}$/.test(digits)) return "234" + digits.slice(1);
  if (/^234[7-9]0\d{8}$/.test(digits)) return digits;
  return null;
}

function dayString(d: Date): string {
  const lagos = new Date(d.getTime() + 60 * 60 * 1000);
  return lagos.toISOString().slice(0, 10);
}

async function sendTermiiSms(to: string, message: string): Promise<void> {
  const apiKey = process.env.TERMII_API_KEY;
  const senderId = process.env.TERMII_SENDER_ID;
  const base = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
  if (!apiKey || !senderId) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${base}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: apiKey,
        to,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "dnd",
      }),
    });
  } catch {
    // SMS failure must never block or fail the sale log.
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  let body: {
    shopId?: string;
    kg?: number;
    amount?: number;
    paymentType?: PaymentType;
    customerPhone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const shopId = body.shopId?.trim();
  const kg = Number(body.kg);
  const amount = Number(body.amount);
  const paymentType = body.paymentType;

  if (!shopId) {
    return NextResponse.json({ ok: false, error: "missing shopId" }, { status: 400 });
  }
  if (!(kg > 0 && kg <= 100)) {
    return NextResponse.json({ ok: false, error: "invalid kg" }, { status: 400 });
  }
  if (!(amount > 0 && amount <= 10_000_000)) {
    return NextResponse.json({ ok: false, error: "invalid amount" }, { status: 400 });
  }
  if (paymentType !== "cash" && paymentType !== "transfer") {
    return NextResponse.json({ ok: false, error: "invalid paymentType" }, { status: 400 });
  }

  let shopName = "your gas seller";
  try {
    const shopSnap = await adminDb.collection("sellers").doc(shopId).get();
    const name = shopSnap.data()?.businessName;
    if (typeof name === "string" && name.trim()) shopName = name.trim();
  } catch {
    // non-fatal
  }

  const day = dayString(new Date());

  await adminDb.collection("walkins").add({
    shopId,
    kg,
    amountNaira: amount,
    paymentType,
    customerPhone: body.customerPhone?.trim() ? body.customerPhone.trim() : null,
    source: "seller-studio",
    day,
    createdAt: FieldValue.serverTimestamp(),
  });

  const todaySnap = await adminDb
    .collection("walkins")
    .where("shopId", "==", shopId)
    .where("day", "==", day)
    .count()
    .get();
  const walkinsToday = todaySnap.data().count;

  const normalized = body.customerPhone ? normalizeNgPhone(body.customerPhone) : null;
  if (normalized) {
    const message =
      `Thanks for refilling at ${shopName} (${kg}kg - N${amount.toLocaleString("en-NG")}). ` +
      `Next refill on OGas gets you N200 off. Live price: https://ogaslpgmarketplace.com/buy`;
    await sendTermiiSms(normalized, message);
  }

  return NextResponse.json({ ok: true, walkinsToday });
}
