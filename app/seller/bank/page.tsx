'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { authHeaders } from '@/lib/client-auth';
import { ArrowLeft, Banknote, CheckCircle, Loader2, Shield } from 'lucide-react';
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
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({
    accountNumber: '',
    bankCode: '',
    bankName: '',
    accountName: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [resolvedNote, setResolvedNote] = useState('');

  const selectedBank = NIGERIAN_BANKS.find((b) => b.code === form.bankCode);

  useEffect(() => {
    if (!user) {
      setLoadingExisting(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/seller-bank', { headers });
        const data = await res.json();
        if (!cancelled && data.success && data.hasBank) {
          setForm({
            accountNumber: data.accountNumber || '',
            bankCode: data.bankCode || '',
            bankName: data.bankName || '',
            accountName: data.accountName || '',
          });
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async () => {
    if (!form.accountNumber || form.accountNumber.length !== 10) {
      setError('Enter a valid 10-digit account number');
      return;
    }
    if (!form.bankCode) {
      setError('Select your bank');
      return;
    }
    if (!form.accountName.trim()) {
      setError('Enter account name');
      return;
    }

    setError('');
    setResolvedNote('');
    setLoading(true);

    try {
      const headers = await authHeaders();
      const res = await fetch('/api/seller-bank', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountNumber: form.accountNumber,
          bankCode: form.bankCode,
          bankName: selectedBank?.name || form.bankName,
          accountName: form.accountName.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to save');

      if (data.accountName && data.accountName !== form.accountName) {
        setForm((f) => ({ ...f, accountName: data.accountName }));
        setResolvedNote(`Verified name: ${data.accountName}`);
      }
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please sign in first</p>
          <Link href="/seller/login" className="text-orange-500 font-semibold">
            Seller login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/seller/dashboard" className="p-2 bg-gray-900 rounded-lg border border-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">Payout account</h1>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-green-500/15 rounded-xl">
              <Banknote className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold">Where we send your money</h2>
              <p className="text-sm text-gray-400">After Door Code or buyer confirms delivery</p>
            </div>
          </div>

          {saved ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">Bank details saved</h3>
              {resolvedNote && <p className="text-sm text-green-400 mt-2">{resolvedNote}</p>}
              <p className="text-sm text-gray-400 mt-2">
                You will receive payouts here when buyers confirm or enter the Door Code.
              </p>
              <Link
                href="/seller/dashboard"
                className="inline-block mt-5 px-6 py-3 bg-orange-500 text-black font-bold rounded-xl"
              >
                Back to dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bank</label>
                  <select
                    className="w-full p-3 border border-gray-700 rounded-xl bg-gray-950 text-white"
                    value={form.bankCode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bankCode: e.target.value,
                        bankName: NIGERIAN_BANKS.find((b) => b.code === e.target.value)?.name || '',
                      })
                    }
                  >
                    <option value="">-- Choose your bank --</option>
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Account number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full p-3 border border-gray-700 rounded-xl bg-gray-950 text-white"
                    placeholder="10 digits"
                    value={form.accountNumber}
                    onChange={(e) =>
                      setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Account name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-700 rounded-xl bg-gray-950 text-white"
                    placeholder="Name as on the account"
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full py-3.5 bg-orange-500 text-black font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying and saving…
                    </>
                  ) : (
                    'Save payout account'
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center flex items-center justify-center gap-1">
                <Shield size={12} />
                Used only to pay you. Never shared with buyers.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
