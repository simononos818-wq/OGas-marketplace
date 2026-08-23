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

  const from = process.env.TERMII_SENDER_ID || '';
  const bases = [
    'https://v4.api.termii.com',
    process.env.TERMII_BASE_URL || '',
    'https://v3.api.termii.com',
  ]
    .map((b) => b.replace(/\/$/, ''))
    .filter(Boolean);

  const attempts: Array<{ url: string; body: Record<string, unknown> }> = [];
  for (const base of [...new Set(bases)]) {
    attempts.push({
      url: `${base}/api/sms/number/send`,
      body: { to: phone, sms: message, api_key: key },
    });
    attempts.push({
      url: `${base}/api/v1/sms/number/send`,
      body: { to: phone, sms: message, api_key: key },
    });
    if (from) {
      for (const channel of ['generic', 'dnd'] as const) {
        const branded = { to: phone, from, sms: message, type: 'plain', channel, api_key: key };
        attempts.push({ url: `${base}/api/sms/send`, body: branded });
        attempts.push({ url: `${base}/api/v1/sms/send`, body: branded });
      }
    }
  }

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt.body),
      });
      const text = await res.text().catch(() => '');
      if (res.ok) {
        console.log('sms sent', phone, attempt.url);
        return { sent: true as const };
      }
      console.error('Termii SMS failed', res.status, attempt.url, text.slice(0, 220));
    } catch (err) {
      console.error('Termii SMS error', err);
    }
  }
  return { sent: false, reason: 'termii_error' as const };
}
