'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Store, MapPin, Package, ArrowRight } from 'lucide-react';

export default function VendorRegisterPage() {
  const auth = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    phone: '',
    lpgTypes: [] as string[],
    bankName: '',
    accountName: '',
    accountNumber: '',
  });
  const [loading, setLoading] = useState(false);

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-orange-500 text-xl font-bold"
        >
          🔥 OGas Loading...
        </motion.div>
      </div>
    );
  }

  const { registerWithEmail } = auth;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const email = formData.phone + '@ogas.temp';
      await registerWithEmail(email, 'TempPass123!', 'vendor');
      router.push('/vendor/dashboard');
    } catch (err) {
      alert('Registration failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const lpgOptions = ['3kg', '5kg', '6kg', '12.5kg', '25kg', '50kg'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] rounded-2xl p-8 border border-orange-500/20"
        >
          <div className="text-center mb-8">
            <Store className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Become a Seller</h1>
            <p className="text-gray-400 mt-2">Start earning with OGas today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Business Name</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                placeholder="e.g. ABC Gas Ventures"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <MapPin className="w-4 h-4 inline mr-1" /> Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                placeholder="Full business address"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                <Package className="w-4 h-4 inline mr-1" /> LPG Sizes You Sell
              </label>
              <div className="grid grid-cols-3 gap-2">
                {lpgOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      const newTypes = formData.lpgTypes.includes(size)
                        ? formData.lpgTypes.filter(t => t !== size)
                        : [...formData.lpgTypes, size];
                      setFormData({...formData, lpgTypes: newTypes});
                    }}
                    className={`py-2 rounded-lg text-sm font-medium transition ${
                      formData.lpgTypes.includes(size)
                        ? 'bg-orange-500 text-white'
                        : 'bg-[#2a2a2a] text-gray-400 border border-gray-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-white font-semibold mb-4">Bank Details for Payouts</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Bank Name (e.g. GTBank)"
                />
                <input
                  type="text"
                  required
                  value={formData.accountName}
                  onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Account Name"
                />
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Account Number"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || formData.lpgTypes.length === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {loading ? 'Creating Account...' : <>Start Selling <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
