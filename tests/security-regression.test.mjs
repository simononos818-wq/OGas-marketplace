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


const checkout = readFileSync(new URL('../app/api/checkout/route.ts', import.meta.url), 'utf8');
const webhook = readFileSync(new URL('../app/api/webhook/route.ts', import.meta.url), 'utf8');
const verifyPayment = readFileSync(new URL('../app/api/verify-payment/route.ts', import.meta.url), 'utf8');

test('Paystack checkout derives price server-side and stores a canonical payment intent', () => {
  assert.match(checkout, /randomBytes\(8\)/);
  assert.match(checkout, /amountKobo,/);
  assert.match(checkout, /currency: 'NGN'/);
  assert.match(checkout, /payment:\s*\{/);
  assert.match(checkout, /orderBuyerId\(current\) !== user\.uid/);
  assert.doesNotMatch(checkout, /body\.amount|amount != null/);
  assert.doesNotMatch(checkout, /sellerId \|\| order\.sellerId/);
  assert.match(checkout, /usedSplitPayment: isSplit/);
});

test('Paystack webhook authenticates raw body and matches exact stored reference, NGN and kobo', () => {
  assert.match(webhook, /createHmac\('sha512'/);
  assert.match(webhook, /timingSafeEqual/);
  assert.match(webhook, /where\('payment\.reference', '==', reference\)/);
  assert.match(webhook, /payment\.reference !== reference/);
  assert.match(webhook, /payment\.currency !== 'NGN'/);
  assert.match(webhook, /Number\(payment\.amount\) !== expected/);
  assert.match(webhook, /adminDb\.runTransaction/);
  assert.match(webhook, /paymentStatus: 'paid'/);
  assert.doesNotMatch(webhook, /250000|expectedKobo - 100|cardFeeKobo = Math\.max/);
});

test('browser verification is buyer-only and cannot mutate payment status', () => {
  assert.match(verifyPayment, /Only the buyer can check this payment/);
  assert.match(verifyPayment, /callbackReference !== storedReference/);
  assert.match(verifyPayment, /payment\.currency !== 'NGN'/);
  assert.match(verifyPayment, /Number\(payment\.amount\) !== expectedKobo/);
  assert.match(verifyPayment, /read-only/);
  assert.doesNotMatch(verifyPayment, /orderRef\.update|orderRef\.set|findPaystackReference/);
});
