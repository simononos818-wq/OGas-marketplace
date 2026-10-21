import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { requireUser } from '../../../../lib/require-user';

// Daily check-in — open the app, tap once, earn Gas Points.
// Day 1 = 5 GP, +1 GP per streak day (cap 15 GP), every 7th streak day = +50 GP bonus.
// One claim per calendar day, West Africa Time.

function watDateKey(d: Date = new Date()): string {
  const wat = new Date(d.getTime() + 60 * 60 * 1000); // UTC+1
  return wat.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = user.uid;
    const userRef = adminDb.collection('users').doc(uid);
    const logRef = adminDb.collection('pointsTransactions').doc();
    const today = watDateKey();
    const yesterday = watDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.data() || {};
      const balance = Math.max(0, Math.floor(Number(data.gasPoints) || 0));
      const streak = Number(data.checkInStreak) || 0;

      if (data.lastCheckIn === today) {
        return { already: true as const, reward: 0, streak, balance };
      }

      const newStreak = data.lastCheckIn === yesterday ? streak + 1 : 1;
      let reward = Math.min(15, 5 + (newStreak - 1));
      if (newStreak % 7 === 0) reward += 50;

      tx.set(
        userRef,
        { gasPoints: balance + reward, lastCheckIn: today, checkInStreak: newStreak },
        { merge: true },
      );
      tx.set(logRef, {
        uid,
        type: 'earn',
        points: reward,
        reason: 'daily_checkin',
        note: `Daily check-in day ${newStreak}`,
        createdAt: new Date(),
      });
      return { already: false as const, reward, streak: newStreak, balance: balance + reward };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('check-in failed:', err);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
