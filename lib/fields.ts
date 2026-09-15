/** Canonical field names + dual-read for older documents. */

export function orderTotal(data: Record<string, any> | null | undefined): number {
  if (!data) return 0;
  const n = Number(data.total ?? data.totalAmount ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function orderBuyerId(data: Record<string, any> | null | undefined): string {
  if (!data) return '';
  return String(data.buyerId || data.userId || '');
}

export function sellerVerified(data: Record<string, any> | null | undefined): boolean {
  if (!data) return false;
  return Boolean(data.verified ?? data.isVerified);
}
