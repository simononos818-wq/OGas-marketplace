import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function ensureBuyerSession() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Could not start a session');
  return user;
}

export async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function saveBuyerContact(phone: string, name?: string, address?: string) {
  const user = await ensureBuyerSession();
  await setDoc(
    doc(db, 'users', user.uid),
    {
      phone,
      name: name || '',
      lastAddress: address || '',
      role: 'buyer',
      updatedAt: new Date(),
    },
    { merge: true },
  );
  return user;
}
