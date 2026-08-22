import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const ALPHABET_LEN = ALPHABET.length;
const REJECT_ABOVE = Math.floor(256 / ALPHABET_LEN) * ALPHABET_LEN;

export function makeDoorCode() {
  let out = '';
  while (out.length < 6) {
    const b = randomBytes(1)[0];
    if (b >= REJECT_ABOVE) continue;
    out += ALPHABET[b % ALPHABET_LEN];
  }
  return out;
}

export function hashDoorCode(orderId: string, code: string) {
  return createHash('sha256')
    .update(`${orderId}:${code.trim().toUpperCase()}`)
    .digest('hex');
}

export function doorCodesMatch(orderId: string, storedHash: string, attempt: string) {
  const h = hashDoorCode(orderId, attempt);
  const a = Buffer.from(h, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function formatDoorCode(code: string) {
  const c = code.toUpperCase().replace(/\s/g, '');
  return c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c;
}
