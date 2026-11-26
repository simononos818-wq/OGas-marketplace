export type PaystackTransaction = {
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  metadata?: { orderId?: string } | null;
};

/**
 * Validate the transaction returned by Paystack's server-side verify endpoint.
 * The stored order reference is authoritative; browser-supplied references are
 * never trusted on their own. OGas absorbs processing fees, so amount is exact.
 */
export function validatePaystackTransaction(
  transaction: PaystackTransaction | null | undefined,
  orderId: string,
  storedReference: string,
  expectedKobo: number,
): { ok: true; paidKobo: number } | { ok: false; reason: string } {
  if (!transaction || transaction.status !== 'success') {
    return { ok: false, reason: 'not_successful' };
  }
  if (!storedReference || transaction.reference !== storedReference) {
    return { ok: false, reason: 'reference_mismatch' };
  }
  if (transaction.metadata?.orderId !== orderId) {
    return { ok: false, reason: 'order_metadata_mismatch' };
  }
  if (transaction.currency !== 'NGN') {
    return { ok: false, reason: 'currency_mismatch' };
  }
  const paidKobo = Number(transaction.amount);
  if (!Number.isSafeInteger(paidKobo) || paidKobo <= 0 || paidKobo !== expectedKobo) {
    return { ok: false, reason: 'amount_mismatch' };
  }
  return { ok: true, paidKobo };
}
