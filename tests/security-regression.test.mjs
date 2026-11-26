import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const storageRules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const escrow = readFileSync(new URL('../lib/escrow.ts', import.meta.url), 'utf8');
const releaseRoute = readFileSync(new URL('../app/api/release-escrow/route.ts', import.meta.url), 'utf8');
const sellerBank = readFileSync(new URL('../app/api/seller-bank/route.ts', import.meta.url), 'utf8');
const orderStatus = readFileSync(new URL('../app/api/order-status/route.ts', import.meta.url), 'utf8');

test('client cannot grant itself admin privileges', () => {
  assert.match(rules, /request\.auth\.token\.get\('admin', false\) == true/);
  assert.match(rules, /hasProtectedUserFields/);
  assert.match(rules, /hasAny\(\['role', 'admin', 'isAdmin', 'permissions'\]\)/);
});

test('orders and chat are participant-scoped and server-write-only', () => {
  assert.match(rules, /allow get, list: if isOrderParticipant\(resource\.data\)/);
  assert.match(rules, /allow create, update, delete: if false/);
  assert.match(rules, /allow get, list: if isChatParticipant\(resource\.data\)/);
  assert.match(rules, /allow get, list: if isChatParticipant\(parentChat\(\)\)/);
});

test('door-code documents cannot be enumerated or client-written', () => {
  assert.match(rules, /allow get: if signedIn\(\) && resource\.data\.buyerId == request\.auth\.uid/);
  assert.match(rules, /allow list, create, update, delete: if false/);
});

test('seller bank details are stored outside the public seller profile', () => {
  assert.match(sellerBank, /collection\('sellerPrivate'\)/);
  assert.match(sellerBank, /FieldValue\.delete\(\)/);
  assert.match(rules, /match \/sellerPrivate\/{sellerId}/);
});

test('escrow release requires delivery and blocks disputed/cancelled orders', () => {
  assert.match(escrow, /order\.status !== 'delivered'/);
  assert.match(escrow, /order\.disputeStatus === 'open'/);
  assert.match(releaseRoute, /order\.status !== 'delivered'/);
  assert.match(releaseRoute, /order\.disputeStatus === 'open'/);
  assert.doesNotMatch(releaseRoute, /status: 'completed',[\s\S]{0,80}paySellerFromEscrow/);
});

test('order-status freezes disputed/cancelled orders and audits the actor', () => {
  assert.match(orderStatus, /order\.disputeStatus === 'open'/);
  assert.match(orderStatus, /order\.cancelledAt/);
  assert.match(orderStatus, /statusChangedBy/);
  assert.match(orderStatus, /statusHistory/);
  assert.match(orderStatus, /FieldValue\.arrayUnion/);
});

test('storage allows images only, keeps identity documents private, default-denies the rest', () => {
  assert.match(storageRules, /contentType\.matches\('image\/\(jpeg\|png\|webp\|heic\)'\)/);
  assert.match(storageRules, /match \/identity\/\{uid\}\/\{file=\*\*\}/);
  assert.match(storageRules, /allow read: if false;/);
  assert.doesNotMatch(storageRules, /allow read: if true;\s*\n\s*allow write: if false;/);
});

test('escrow completion appends a completed status audit event', () => {
  assert.match(escrow, /statusChangedBy: releasedBy/);
  assert.match(escrow, /statusChangedAt: releasedAt/);
  assert.match(escrow, /statusHistory: FieldValue\.arrayUnion/);
  assert.match(escrow, /role: releaseRole/);
});

test('cash completion appends a completed status audit event', () => {
  assert.match(releaseRoute, /statusChangedBy: user\.uid/);
  assert.match(releaseRoute, /statusChangedAt: completedAt/);
  assert.match(releaseRoute, /statusHistory: FieldValue\.arrayUnion/);
  assert.match(releaseRoute, /role: completedRole/);
});
