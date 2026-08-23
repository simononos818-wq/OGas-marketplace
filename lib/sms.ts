function normalizeNgPhone(raw: string) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length >= 13) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export async function sendSms(to: string, message: string) {
  const key = process.env.TERMII_API_KEY;
  if (!key || !to) {
    console.error('sms skip', !key ? 'no_termii_key' : 'no_phone');
    return { sent: false, reason: 'missing_key_or_phone' as const };
  }

  const phone = normalizeNgPhone(to);
  if (phone.length < 11) return { sent: false, reason: 'bad_phone' as const };

  const from = process.env.TERMII_SENDER_ID || 'N-Alert';
  const bases = [
    process.env.TERMII_BASE_URL || '',
    'https://v3.api.termii.com',
    'https://api.ng.termii.com',
  ]
    .map((b) => b.replace(/\/$/, ''))
    .filter(Boolean);

  const tried = new Set<string>();
  for (const base of bases) {
    for (const channel of ['dnd', 'generic'] as const) {
      const mark = `${base}:${channel}`;
      if (tried.has(mark)) continue;
      tried.add(mark);
      try {
        const res = await fetch(`${base}/api/sms/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phone,
            from,
            sms: message,
            type: 'plain',
            api_key: key,
            channel,
          }),
        });
        const body = await res.text().catch(() => '');
        if (res.ok) {
          console.log('sms sent', phone, channel, base);
          return { sent: true as const };
        }
        console.error('Termii SMS failed', res.status, channel, body.slice(0, 240));
      } catch (err) {
        console.error('Termii SMS error', err);
      }
    }
  }
  return { sent: false, reason: 'termii_error' as const };
}
