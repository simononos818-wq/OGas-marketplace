/** Nigerian phone helpers. Always store E.164 (+234…). */

export function normalizeNgPhone(input: string): string {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234') && digits.length >= 13) return `+${digits.slice(0, 13)}`;
  if (digits.startsWith('0') && digits.length >= 11) return `+234${digits.slice(1, 11)}`;
  if (digits.length === 10) return `+234${digits}`;
  if (digits.startsWith('234')) return `+${digits}`;
  return digits.startsWith('+') ? `+${digits}` : `+${digits}`;
}

export function isNgPhone(input: string): boolean {
  const n = normalizeNgPhone(input);
  return /^\+234[789]\d{9}$/.test(n);
}

export function phoneLocal(input: string): string {
  const n = normalizeNgPhone(input);
  if (n.startsWith('+234')) return `0${n.slice(4)}`;
  return input;
}
