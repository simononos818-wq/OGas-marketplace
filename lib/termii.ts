// lib/termii.ts — SERVER ONLY. Never import from a client component.
import "server-only";

const BASE = process.env.TERMII_BASE_URL ?? "https://v4.api.termii.com";
const KEY = process.env.TERMII_API_KEY ?? "";
const FROM = process.env.TERMII_SENDER_ID ?? "OGas";

function assertConfigured() {
  if (!KEY) throw new Error("TERMII_API_KEY is not set");
}

/** 0813 311 0237 / +234813... / 8133110237 -> 2348133110237 (or null if invalid) */
export function toE164Ng(input: string): string | null {
  const d = input.replace(/\D/g, "");
  let n = d;
  if (n.startsWith("0")) n = "234" + n.slice(1);
  else if (/^[789]\d{9}$/.test(n)) n = "234" + n;
  return /^234[789]\d{9}$/.test(n) ? n : null;
}

async function termiiPost(path: string, body: Record<string, unknown>) {
  assertConfigured();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: KEY, ...body }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Termii ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data as Record<string, any>;
}

/** Generate + deliver a numeric OTP. Returns { pin_id, ... } — persist pin_id, NEVER the code. */
export async function sendOtp(phone: string, purpose: "login" | "checkout") {
  return termiiPost("/api/sms/otp/send", {
    message_type: "NUMERIC",
    pin_type: "NUMERIC",
    to: phone,
    from: FROM,
    channel: "dnd",
    pin_attempts: 3,
    pin_time_to_live: 5,
    pin_length: 6,
    pin_placeholder: "< 123456 >",
    message_text:
      purpose === "checkout"
        ? "OGas: your checkout code is < 123456 >. Valid 5 mins. Do not share it."
        : "OGas: your login code is < 123456 >. Valid 5 mins. Do not share it.",
  });
}

/** Verify a code against a pin_id we stored when the OTP was sent. */
export async function verifyOtp(pinId: string, pin: string) {
  return termiiPost("/api/sms/otp/verify", { pin_id: pinId, pin });
}

/** Plain transactional SMS (order updates). */
export async function sendSms(to: string, sms: string) {
  return termiiPost("/api/sms/send", { to, from: FROM, sms, type: "plain", channel: "dnd" });
}
