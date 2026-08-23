import { NextRequest } from 'next/server';

type AuthedUser = { uid: string; email?: string };

export async function requireUser(req: NextRequest): Promise<AuthedUser | null> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey.includes('dummy')) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      },
    );
    const data = await res.json();
    const u = data?.users?.[0];
    if (!u?.localId) return null;
    return { uid: u.localId, email: u.email || undefined };
  } catch {
    return null;
  }
}
