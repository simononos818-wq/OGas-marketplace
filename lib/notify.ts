// lib/notify.ts — order-event notifications for OGas.
// Call notifyOrderEvent() AFTER the order write succeeds. Never block the
// buyer's request on SMS: this is fire-and-forget with its own try/catch.
import { sendSms, toE164Ng } from "./termii";
import { adminDb } from "./firebase-admin";

export type OrderEvent = "placed" | "confirmed" | "on_the_way" | "delivered" | "cancelled";

export type NotifyOrder = {
  id: string;
  buyerPhone?: string;
  buyerName?: string;
  sellerPhone?: string;
  sellerName?: string;
  kg: number;
  total: number;
};

function naira(n: number) {
  return `N${n.toLocaleString("en-NG")}`;
}

const BUYER_MSG: Record<OrderEvent, (o: NotifyOrder) => string> = {
  placed: (o) => `OGas: order received! ${o.kg}kg refill, ${naira(o.total)}. We will confirm shortly.`,
  confirmed: (o) => `OGas: ${o.sellerName ?? "your seller"} accepted your ${o.kg}kg order (${naira(o.total)}).`,
  on_the_way: (o) => `OGas: your ${o.kg}kg gas is on the way. Have your ${naira(o.total)} ready. Thank you!`,
  delivered: (o) => `OGas: delivered! ${o.kg}kg refill done. Tap Reorder anytime. Thank you for using OGas.`,
  cancelled: (o) => `OGas: your ${o.kg}kg order was cancelled. Any money paid will be refunded. Sorry for the trouble.`,
};

const SELLER_MSG: Record<OrderEvent, (o: NotifyOrder) => string> = {
  placed: (o) => `OGas: NEW ORDER #${o.id.slice(0, 6)} — ${o.kg}kg, ${naira(o.total)}. Open Seller Studio to accept.`,
};

/** Fire-and-forget: logs to Firestore `messageLog`, never throws into the caller. */
export async function notifyOrderEvent(order: NotifyOrder, event: OrderEvent) {
  const jobs: Promise<unknown>[] = [];
  const log: Record<string, unknown> = { orderId: order.id, event, at: new Date().toISOString() };

  const buyer = order.buyerPhone ? toE164Ng(order.buyerPhone) : null;
  if (buyer) jobs.push(sendSms(buyer, BUYER_MSG[event](order)).then((r) => (log.buyer = r?.message ?? "sent")));

  const seller = order.sellerPhone ? toE164Ng(order.sellerPhone) : null;
  if (seller && SELLER_MSG[event]) {
    jobs.push(sendSms(seller, SELLER_MSG[event](order)).then((r) => (log.seller = r?.message ?? "sent")));
  }

  const results = await Promise.allSettled(jobs);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`notify[${order.id}/${event}] job ${i}:`, r.reason);
  });

  try {
    await adminDb.collection("messageLog").add({ ...log, results: results.map((r) => r.status) });
  } catch (e) {
    console.error("messageLog write failed:", e);
  }
}
