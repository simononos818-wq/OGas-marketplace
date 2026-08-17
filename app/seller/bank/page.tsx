'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/app/hooks/useAuth';
import { ArrowLeft, Banknote, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const NIGERIAN_BANKS = [
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '035', name: 'Wema Bank' },
  { code: '058', name: 'Guaranty Trust Bank (GTB)' },
  { code: '044', name: 'Access Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '215', name: 'Unity Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '302', name: 'Eartholeum' },
  { code: '039', name: 'Citibank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '100', name: 'SunTrust Bank' },
  { code: '999991', name: 'Opay' },
  { code: '999992', name: 'Palmpay' },
  { code: '999993', name: 'Moniepoint' },
];

export default function SellerBankPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ accountNumber: '', bankCode: '', bankName: '', accountName: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const selectedBank = NIGERIAN_BANKS.find(b => b.code === form.bankCode);

  const handleSave = async () => {
    if (!form.accountNumber || form.accountNumber.length !== 10) {
      setError('Enter a valid 10-digit account number');
      return;
    }
    if (!form.bankCode) {
      setError('Select your bank');
      return;
    }
    if (!form.accountName) {
      setError('Enter account name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const saveBank = httpsCallable(functions, 'saveSellerBankDetails');
      await saveBank({
        accountNumber: form.accountNumber,
        bankCode: form.bankCode,
        bankName: selectedBank?.name || form.bankName,
        accountName: form.accountName,
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Try again.');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Please login first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/seller/dashboard" className="p-2 bg-white rounded-lg shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Bank Account</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Banknote className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Payout Account</h2>
              <p className="text-sm text-gray-500">Where we send your money</p>
            </div>
          </div>

          {saved ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800">Bank Details Saved!</h3>
              <p className="text-sm text-gray-500 mt-1">You will receive payouts to this account when buyers confirm delivery.</p>
              <Link href="/seller/dashboard" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.bankCode}
                    onChange={e => setForm({...form, bankCode: e.target.value, bankName: NIGERIAN_BANKS.find(b => b.code === e.target.value)?.name || ''})}
                  >
                    <option value="">-- Choose your bank --</option>
                    {NIGERIAN_BANKS.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full p-3 border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10 digits"
                    value={form.accountNumber}
                    onChange={e => setForm({...form, accountNumber: e.target.value.replace(/\D/g, '')})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name as it appears in bank"
                    value={form.accountName}
                    onChange={e => setForm({...form, accountName: e.target.value})}
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Save Bank Details'}
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Your bank details are encrypted and secure. We only use them to send your payouts.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
