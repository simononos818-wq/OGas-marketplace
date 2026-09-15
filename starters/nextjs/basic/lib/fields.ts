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

export function formatNaira(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return '₦0';
  return '₦' + Math.round(n).toLocaleString();
}

export function normalizeNgPhone(phone: string): string {
  let p = (phone || '').trim().replace(/\s+/g, '');
  if (!p.startsWith('+')) {
    if (p.startsWith('0')) p = '+234' + p.slice(1);
    else if (p.startsWith('234')) p = '+' + p;
    else p = '+234' + p;
  }
  return p;
}
