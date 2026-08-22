export type ChatRole = 'buyer' | 'seller';

export type QuickChip = { key: string; label: string; body: string };

export const BUYER_QUICK: QuickChip[] = [
  { key: 'eta', label: 'How far?', body: 'How far are you?' },
  { key: 'close', label: 'Message at gate', body: "Please message when you're at my gate." },
  { key: 'wait', label: 'Give me 10 min', body: "Give me about 10 minutes — I'm not at the door yet." },
  { key: 'thanks', label: 'Thank you', body: "Thank you. I'll be ready with the Door Code at handover." },
];

export const SELLER_QUICK: QuickChip[] = [
  { key: 'filling', label: 'Filling now', body: 'Accepted — filling your cylinder now.' },
  { key: 'riding', label: 'On the way', body: "Rider is on the way. I'll message when I'm close." },
  { key: 'gate', label: 'At your gate', body: "I'm at your gate." },
  { key: 'traffic', label: '10 more min', body: 'Traffic — about 10 more minutes.' },
];

export const SYSTEM_COPY = {
  placed:
    'Chat is open for this delivery. Phone numbers stay private. Never share your Door Code here — say it only when the cylinder is in your hands.',
  accepted: 'The store accepted your order and is filling the cylinder.',
  en_route: 'Your gas is on the way. Stay in this chat for arrival updates.',
  at_gate: 'Rider marked this delivered. Say the Door Code only when the cylinder is in your hands.',
  released: 'Delivery confirmed. Escrow has been released.',
  cash_done: 'Cash order completed. Thank you for using OGas.',
} as const;

export function chipsForRole(role: ChatRole) {
  return role === 'buyer' ? BUYER_QUICK : SELLER_QUICK;
}

export function bodyForQuickKey(key: string, role: ChatRole) {
  return chipsForRole(role).find((c) => c.key === key)?.body ?? null;
}

export function systemCopyForStatus(status: string) {
  switch (status) {
    case 'confirmed':
      return SYSTEM_COPY.accepted;
    case 'out_for_delivery':
      return SYSTEM_COPY.en_route;
    case 'delivered':
      return SYSTEM_COPY.at_gate;
    case 'completed':
      return SYSTEM_COPY.released;
    default:
      return null;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function redactPrivate(text: string, doorCode?: string | null, extraPhones: string[] = []) {
  let out = String(text || '').replace(/\u00a0/g, ' ');
  if (doorCode) {
    const compact = doorCode.replace(/\s+/g, '').toUpperCase();
    if (compact.length >= 4) {
      const spaced =
        compact.length === 6 ? `${compact.slice(0, 3)}\\s*${compact.slice(3)}` : escapeRegExp(compact);
      out = out.replace(new RegExp(spaced, 'ig'), '[Door Code hidden]');
      out = out.replace(new RegExp(escapeRegExp(compact), 'ig'), '[Door Code hidden]');
    }
  }
  for (const raw of extraPhones) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length < 10) continue;
    const local = digits.startsWith('234') ? `0${digits.slice(3)}` : digits;
    const intl = digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
    out = out.replace(new RegExp(escapeRegExp(raw), 'ig'), '[number hidden]');
    out = out.replace(new RegExp(escapeRegExp(local), 'g'), '[number hidden]');
    out = out.replace(new RegExp(escapeRegExp(intl), 'g'), '[number hidden]');
  }
  out = out.replace(/\b(?:\+?234|0)[\s-]*(?:\d[\s-]*){9,10}\b/g, '[number hidden]');
  out = out.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[contact hidden]');
  out = out.replace(/\b(?:wa\.me|whatsapp|whats\s*app)\b[^\s]*/gi, '[contact hidden]');
  return out.replace(/[ \t]+/g, ' ').trim();
}
