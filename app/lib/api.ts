// OGas API Client - Points to Firebase Cloud Functions
const API_BASE = 'https://us-central1-ogasapp-5a003.cloudfunctions.net';

// Paystack Public Key for frontend
export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

export const api = {
  verify: (reference: string) => 
    `${API_BASE}/paymentVerify`,
  
  resolve: (accountNumber: string, bankCode: string) => 
    `${API_BASE}/resolveBank`,
};

// Verify payment via Cloud Function
export async function verifyPayment(reference: string) {
  const res = await fetch(`${API_BASE}/paymentVerify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });
  if (!res.ok) throw new Error('Payment verification failed');
  return res.json();
}

// Resolve bank account via Cloud Function
export async function resolveBankAccount(accountNumber: string, bankCode: string) {
  const res = await fetch(`${API_BASE}/resolveBank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountNumber, bankCode }),
  });
  if (!res.ok) throw new Error('Bank resolution failed');
  return res.json();
}

// Webhook handler (called from frontend if needed)
export async function sendWebhook(data: any) {
  const res = await fetch(`${API_BASE}/paymentWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Webhook failed');
  return res.json();
}
