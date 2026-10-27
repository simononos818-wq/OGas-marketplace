import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/require-user";

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

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to complete a walk-in sale." }, { status: 401 });
  }

  let body: {
    shopId?: string;
    kg?: number;
    amount?: number;
    paymentType?: PaymentType;
    customerPhone?: string;
    clientSaleId?: string;
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
  const clientSaleId = body.clientSaleId?.trim() || "";

  if (!shopId) {
    return NextResponse.json({ ok: false, error: "missing shopId" }, { status: 400 });
  }
  if (shopId !== user.uid) {
    return NextResponse.json({ ok: false, error: "You can only complete sales for your own shop." }, { status: 403 });
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
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(clientSaleId)) {
    return NextResponse.json({ ok: false, error: "invalid clientSaleId" }, { status: 400 });
  }

  try {
    const shopSnap = await adminDb.collection("sellers").doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ ok: false, error: "Seller profile not found." }, { status: 404 });
    }
    const sellerName = shopSnap.data()?.businessName;
    const shopName = typeof sellerName === "string" && sellerName.trim() ? sellerName.trim() : "your gas seller";
    const day = dayString(new Date());
    const walkinRef = adminDb.collection("walkins").doc(`${shopId}_${clientSaleId}`);
    let duplicate = false;
    let conflict = false;

    await adminDb.runTransaction(async (tx) => {
      const existing = await tx.get(walkinRef);
      if (existing.exists) {
        const sale = existing.data()!;
        conflict = Number(sale.kg) !== kg || Number(sale.amountNaira) !== amount || sale.paymentType !== paymentType;
        duplicate = !conflict;
        return;
      }

      tx.create(walkinRef, {
        shopId,
        kg,
        amountNaira: amount,
        paymentType,
        customerPhone: body.customerPhone?.trim() ? body.customerPhone.trim().slice(0, 32) : null,
        source: "seller-studio",
        status: "completed",
        paymentStatus: "paid_offline",
        settlementStatus: "received_by_seller",
        settlementMethod: "direct",
        sellerEarnings: amount,
        commission: 0,
        day,
        clientSaleId,
        createdAt: FieldValue.serverTimestamp(),
        paidAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
      });
    });

    if (conflict) {
      return NextResponse.json({ ok: false, error: "This sale ID was already used for a different sale." }, { status: 409 });
    }

    const todaySnap = await adminDb
      .collection("walkins")
      .where("shopId", "==", shopId)
      .where("day", "==", day)
      .count()
      .get();
    const walkinsToday = todaySnap.data().count;

    const normalized = body.customerPhone ? normalizeNgPhone(body.customerPhone) : null;
    if (!duplicate && normalized) {
      const message =
        `Thanks for refilling at ${shopName} (${kg}kg - N${amount.toLocaleString("en-NG")}). ` +
        `Next refill on OGas gets you N200 off. Live price: https://www.ogaslpgmarketplace.com/buy`;
      await sendTermiiSms(normalized, message);
    }

    return NextResponse.json({
      ok: true,
      walkinsToday,
      saleId: walkinRef.id,
      amountReceived: amount,
      paymentType,
      paymentStatus: "paid_offline",
      settlementStatus: "received_by_seller",
      duplicate,
    });
  } catch (error) {
    console.error("Walk-in sale completion failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ ok: false, error: "Could not complete the sale. Please try again." }, { status: 500 });
  }
}
