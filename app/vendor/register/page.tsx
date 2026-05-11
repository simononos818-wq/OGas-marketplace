'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Store, MapPin, Package, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { resolveBankAccount } from '@/app/lib/api';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const BANKS = [
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'Guaranty Trust Bank (GTB)' },
  { code: '032', name: 'Union Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '050', name: 'EcoBank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '068', name: 'Standard Chartered' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '215', name: 'Unity Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '302', name: 'Parkway (ReadyCash)' },
  { code: '303', name: 'SunTrust Bank' },
  { code: '304', name: 'Sterling Bank' },
  { code: '305', name: 'Coronation Merchant Bank' },
  { code: '307', name: 'Omoluabi Savings and Loans' },
  { code: '309', name: 'FBNQuest Merchant Bank' },
  { code: '310', name: 'Providus Bank' },
  { code: '311', name: 'Parallex Bank' },
  { code: '312', name: 'MainStreet Bank' },
  { code: '313', name: 'RMB Nigeria' },
  { code: '315', name: 'ASO Savings and Loans' },
  { code: '316', name: 'CEMCS Microfinance Bank' },
  { code: '317', name: 'Cellulant' },
  { code: '318', name: 'Fidelity Mobile' },
  { code: '319', name: 'Teasy Mobile' },
  { code: '320', name: 'VTNetworks' },
  { code: '321', name: 'Stanbic Mobile' },
  { code: '322', name: 'Fortis Microfinance Bank' },
  { code: '323', name: 'Hedonmark' },
  { code: '324', name: 'MoneyBox' },
  { code: '325', name: 'Haggai Mortgage Bank' },
  { code: '326', name: 'GTMobile' },
  { code: '327', name: 'Zinternet - NIBSS' },
  { code: '328', name: 'Stanbic IBTC Bank' },
  { code: '329', name: 'PayAttitude Online' },
  { code: '330', name: 'ChamsMobile' },
  { code: '331', name: 'AccessMobile' },
  { code: '332', name: 'FET' },
  { code: '333', name: 'FirstBank Mobile' },
  { code: '334', name: 'ZenithMobile' },
  { code: '335', name: 'EcoMobile' },
  { code: '336', name: 'Fidelity Mobile' },
  { code: '337', name: 'UnionMobile' },
  { code: '338', name: 'UBAMobile' },
  { code: '339', name: 'WemaMobile' },
  { code: '340', name: 'Pagatech' },
  { code: '341', name: 'Stanbic Mobile Money' },
  { code: '342', name: 'FortisMobile' },
  { code: '343', name: 'Hedonmark' },
  { code: '344', name: 'Zenith Mobile' },
  { code: '345', name: 'EcoMobile' },
  { code: '346', name: 'Fidelity Mobile' },
  { code: '347', name: 'UnionMobile' },
  { code: '348', name: 'UBAMobile' },
  { code: '349', name: 'WemaMobile' },
  { code: '401', name: 'ASO Savings and Loans' },
  { code: '402', name: 'Jubilee Life Mortgage Bank' },
  { code: '403', name: 'SafeTrust Mortgage Bank' },
  { code: '404', name: 'Ag Mortgage Bank' },
  { code: '405', name: 'Trustbond Mortgage Bank' },
  { code: '406', name: 'Imperial Homes Mortgage Bank' },
  { code: '407', name: 'SageGrey Finance' },
  { code: '408', name: 'New Prudential Bank' },
  { code: '409', name: 'Omega Bank' },
  { code: '410', name: 'FBN Mortgages Limited' },
  { code: '411', name: 'New Dawn Microfinance Bank' },
  { code: '412', name: 'Gowans Microfinance Bank' },
  { code: '413', name: 'Fortis Microfinance Bank' },
  { code: '414', name: 'Contec Global' },
  { code: '415', name: 'Sunbeam Microfinance Bank' },
  { code: '416', name: 'SageGrey' },
  { code: '417', name: 'Baines Credit Microfinance Bank' },
  { code: '418', name: 'Amju Unique Microfinance Bank' },
  { code: '419', name: 'Grooming Microfinance Bank' },
  { code: '420', name: 'PennyWise Microfinance Bank' },
  { code: '421', name: 'AB Microfinance Bank' },
  { code: '422', name: 'Lavender Microfinance Bank' },
  { code: '423', name: 'Manny Microfinance Bank' },
  { code: '424', name: 'LetMicrofinance Bank' },
  { code: '425', name: 'Coastal Microfinance Bank' },
  { code: '426', name: 'Corestep Microfinance Bank' },
  { code: '427', name: 'Fairsave Microfinance Bank' },
  { code: '428', name: 'PecanTrust Microfinance Bank' },
  { code: '429', name: 'Royal Exchange Microfinance Bank' },
  { code: '430', name: 'VFD Microfinance Bank' },
  { code: '431', name: 'Verite Microfinance Bank' },
  { code: '432', name: 'Giant Stride Microfinance Bank' },
  { code: '433', name: 'Accion Microfinance Bank' },
  { code: '434', name: 'Fullrange Microfinance Bank' },
  { code: '435', name: 'Trident Microfinance Bank' },
  { code: '436', name: 'Hackman Microfinance Bank' },
  { code: '437', name: 'Bosak Microfinance Bank' },
  { code: '438', name: 'Lapo Microfinance Bank' },
  { code: '439', name: 'GreenBank Microfinance Bank' },
  { code: '440', name: 'Fast Microfinance Bank' },
  { code: '441', name: 'Infinity Microfinance Bank' },
  { code: '442', name: 'Finca Microfinance Bank' },
  { code: '443', name: 'CIT Microfinance Bank' },
  { code: '444', name: 'Richway Microfinance Bank' },
  { code: '445', name: 'New Edge Finance' },
  { code: '446', name: 'Consumer Microfinance Bank' },
  { code: '447', name: 'Assets Microfinance Bank' },
  { code: '448', name: 'Pillar Microfinance Bank' },
  { code: '449', name: 'Microcred Microfinance Bank' },
  { code: '450', name: 'Credit Afrique Microfinance Bank' },
  { code: '451', name: 'Addosser Microfinance Bank' },
  { code: '452', name: 'Okpoga Microfinance Bank' },
  { code: '453', name: 'Nigerian Police Force Microfinance Bank' },
  { code: '454', name: 'Rand Merchant Bank' },
  { code: '455', name: 'Globus Bank' },
  { code: '456', name: 'Titan Trust Bank' },
  { code: '501', name: 'NPF Microfinance Bank' },
  { code: '502', name: 'Parallex Bank' },
  { code: '503', name: 'Titan Trust Bank' },
  { code: '505', name: 'Nova Merchant Bank' },
  { code: '506', name: 'Premium Trust Bank' },
  { code: '507', name: 'Signature Bank' },
  { code: '508', name: 'Polaris Bank' },
  { code: '509', name: 'Optimus Bank' },
  { code: '510', name: 'Kuda Bank' },
  { code: '511', name: 'Moniepoint Microfinance Bank' },
  { code: '512', name: 'Eyowo' },
  { code: '513', name: 'Rubies Bank' },
  { code: '514', name: 'VFD Microfinance Bank' },
  { code: '515', name: 'Sparkle Microfinance Bank' },
  { code: '516', name: 'Balogun Gambari Microfinance Bank' },
  { code: '517', name: 'Lovonus Microfinance Bank' },
  { code: '518', name: 'Unical Microfinance Bank' },
  { code: '519', name: 'Olowolagba Microfinance Bank' },
  { code: '520', name: 'Borstal Microfinance Bank' },
  { code: '521', name: 'Oluyole Microfinance Bank' },
  { code: '522', name: 'Gbede Microfinance Bank' },
  { code: '523', name: 'Wetland Microfinance Bank' },
  { code: '524', name: 'Hasal Microfinance Bank' },
  { code: '525', name: 'Gombe Microfinance Bank' },
  { code: '526', name: 'Regent Microfinance Bank' },
  { code: '527', name: 'FCT Microfinance Bank' },
  { code: '528', name: 'Bauchi Microfinance Bank' },
  { code: '529', name: 'Borno Microfinance Bank' },
  { code: '530', name: 'Cross River Microfinance Bank' },
  { code: '531', name: 'Lagos Building Investment Company' },
  { code: '532', name: 'Osun Microfinance Bank' },
  { code: '533', name: 'Nassarawa Microfinance Bank' },
  { code: '534', name: 'Imo State Microfinance Bank' },
  { code: '535', name: 'Alekun Microfinance Bank' },
  { code: '536', name: 'Ekiti Microfinance Bank' },
  { code: '537', name: 'Trustfund Microfinance Bank' },
  { code: '538', name: 'Alvana Microfinance Bank' },
  { code: '539', name: 'Osam Microfinance Bank' },
  { code: '540', name: 'Chikum Microfinance Bank' },
  { code: '541', name: 'Yes Microfinance Bank' },
  { code: '542', name: 'Aso Microfinance Bank' },
  { code: '543', name: 'Minna Microfinance Bank' },
  { code: '544', name: 'Cloverleaf Microfinance Bank' },
  { code: '545', name: 'Boi Microfinance Bank' },
  { code: '546', name: 'Adamawa Microfinance Bank' },
  { code: '547', name: 'Ibom Fadama Microfinance Bank' },
  { code: '548', name: 'ICB Microfinance Bank' },
  { code: '549', name: 'Mainland Microfinance Bank' },
  { code: '550', name: 'Astrapolaris Microfinance Bank' },
  { code: '551', name: 'Reliance Microfinance Bank' },
  { code: '552', name: 'Rahama Microfinance Bank' },
  { code: '553', name: 'Mutual Benefits Microfinance Bank' },
  { code: '554', name: 'Pristine Divitis Microfinance Bank' },
  { code: '555', name: 'FBN Mortgages Limited' },
  { code: '556', name: 'New Prudential Bank' },
  { code: '557', name: 'FSDH Merchant Bank' },
  { code: '558', name: 'Coronation Merchant Bank' },
  { code: '559', name: 'Nova Merchant Bank' },
  { code: '560', name: 'Greenwich Merchant Bank' },
  { code: '561', name: 'FBNQuest Merchant Bank' },
  { code: '562', name: 'Rand Merchant Bank' },
  { code: '563', name: 'Providus Bank' },
  { code: '564', name: 'Parallex Bank' },
  { code: '565', name: 'Premium Trust Bank' },
  { code: '566', name: 'Signature Bank' },
  { code: '567', name: 'Optimus Bank' },
  { code: '568', name: 'Sterling Bank' },
  { code: '569', name: 'Polaris Bank' },
  { code: '570', name: 'Unity Bank' },
  { code: '571', name: 'Wema Bank' },
  { code: '572', name: 'Zenith Bank' },
  { code: '573', name: 'Access Bank' },
  { code: '574', name: 'EcoBank' },
  { code: '575', name: 'Fidelity Bank' },
  { code: '576', name: 'First Bank' },
  { code: '577', name: 'Guaranty Trust Bank' },
  { code: '578', name: 'Union Bank' },
  { code: '579', name: 'United Bank for Africa' },
  { code: '580', name: 'Stanbic IBTC Bank' },
  { code: '581', name: 'Standard Chartered' },
  { code: '582', name: 'Keystone Bank' },
  { code: '583', name: 'First City Monument Bank' },
  { code: '584', name: 'Jaiz Bank' },
  { code: '585', name: 'SunTrust Bank' },
  { code: '586', name: 'Providus Bank' },
  { code: '587', name: 'Titan Trust Bank' },
  { code: '588', name: 'Globus Bank' },
  { code: '589', name: 'Kuda Bank' },
  { code: '590', name: 'Rubies Bank' },
  { code: '591', name: 'VFD Microfinance Bank' },
  { code: '592', name: 'Sparkle Microfinance Bank' },
  { code: '593', name: 'Moniepoint Microfinance Bank' },
  { code: '594', name: 'Eyowo' },
  { code: '595', name: 'Fidelity Bank' },
  { code: '596', name: 'Paga' },
  { code: '597', name: 'Opay' },
  { code: '598', name: 'Palmpay' },
  { code: '599', name: 'Chipper Cash' },
  { code: '600', name: 'FairMoney' },
  { code: '601', name: 'Carbon' },
  { code: '602', name: 'Branch' },
  { code: '603', name: 'Renmoney' },
  { code: '604', name: 'Specta' },
  { code: '605', name: 'QuickCheck' },
  { code: '606', name: 'Aella Credit' },
  { code: '607', name: 'Lydia' },
  { code: '608', name: 'Migo' },
  { code: '609', name: 'Kiakia' },
  { code: '610', name: 'Page Financials' },
  { code: '611', name: 'CreditDirect' },
  { code: '612', name: 'Rosabon Financial Services' },
  { code: '613', name: 'LAPO Microfinance Bank' },
  { code: '614', name: 'Accion Microfinance Bank' },
  { code: '615', name: 'AB Microfinance Bank' },
  { code: '616', name: 'FBN Mortgages Limited' },
  { code: '617', name: 'New Prudential Bank' },
  { code: '618', name: 'FSDH Merchant Bank' },
  { code: '619', name: 'Coronation Merchant Bank' },
  { code: '620', name: 'Nova Merchant Bank' },
  { code: '621', name: 'Greenwich Merchant Bank' },
  { code: '622', name: 'FBNQuest Merchant Bank' },
  { code: '623', name: 'Rand Merchant Bank' },
  { code: '624', name: 'Providus Bank' },
  { code: '625', name: 'Parallex Bank' },
  { code: '626', name: 'Premium Trust Bank' },
  { code: '627', name: 'Signature Bank' },
  { code: '628', name: 'Optimus Bank' },
  { code: '629', name: 'Sterling Bank' },
  { code: '630', name: 'Polaris Bank' },
  { code: '631', name: 'Unity Bank' },
  { code: '632', name: 'Wema Bank' },
  { code: '633', name: 'Zenith Bank' },
  { code: '634', name: 'Access Bank' },
  { code: '635', name: 'EcoBank' },
  { code: '636', name: 'Fidelity Bank' },
  { code: '637', name: 'First Bank' },
  { code: '638', name: 'Guaranty Trust Bank' },
  { code: '639', name: 'Union Bank' },
  { code: '640', name: 'United Bank for Africa' },
  { code: '641', name: 'Stanbic IBTC Bank' },
  { code: '642', name: 'Standard Chartered' },
  { code: '643', name: 'Keystone Bank' },
  { code: '644', name: 'First City Monument Bank' },
  { code: '645', name: 'Jaiz Bank' },
  { code: '646', name: 'SunTrust Bank' },
  { code: '647', name: 'Providus Bank' },
  { code: '648', name: 'Titan Trust Bank' },
  { code: '649', name: 'Globus Bank' },
  { code: '650', name: 'Kuda Bank' },
  { code: '651', name: 'Rubies Bank' },
  { code: '652', name: 'VFD Microfinance Bank' },
  { code: '653', name: 'Sparkle Microfinance Bank' },
  { code: '654', name: 'Moniepoint Microfinance Bank' },
  { code: '655', name: 'Eyowo' },
  { code: '999', name: 'NIP Virtual Bank' },
];

export default function VendorRegisterPage() {
  const auth = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    address: '',
    phone: '',
    lpgTypes: [] as string[],
    bankCode: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

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

  const { user, registerWithEmail } = auth;

  const handleResolveBank = async () => {
    if (!formData.bankCode || !formData.accountNumber || formData.accountNumber.length !== 10) {
      alert('Please select a bank and enter a valid 10-digit account number');
      return;
    }
    setResolving(true);
    try {
      const data = await resolveBankAccount(formData.accountNumber, formData.bankCode);
      if (data.status === true && data.data) {
        setFormData(prev => ({ ...prev, accountName: data.data.account_name }));
        setResolved(true);
      } else {
        alert('Could not resolve account. Please check your bank details.');
        setResolved(false);
      }
    } catch (err: any) {
      alert('Error resolving bank: ' + err.message);
      setResolved(false);
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resolved) {
      alert('Please verify your bank account first');
      return;
    }
    if (formData.lpgTypes.length === 0) {
      alert('Please select at least one LPG size');
      return;
    }
    setLoading(true);
    
    try {
      let userId = user?.uid;
      if (!userId) {
        const email = formData.phone + '@ogas.temp';
        const cred = await registerWithEmail(email, 'TempPass123!', 'vendor');
        userId = cred.user.uid;
      }

      await setDoc(doc(db, 'vendors', userId), {
        businessName: formData.businessName,
        address: formData.address,
        phone: formData.phone,
        lpgTypes: formData.lpgTypes,
        bankCode: formData.bankCode,
        bankName: formData.bankName,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: userId,
      });

      alert('Seller registration submitted! You can now start selling.');
      router.push('/seller-dashboard');
    } catch (err: any) {
      alert('Registration failed: ' + err.message);
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
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Select Bank</label>
                  <select
                    required
                    value={formData.bankCode}
                    onChange={(e) => {
                      const bank = BANKS.find(b => b.code === e.target.value);
                      setFormData({...formData, bankCode: e.target.value, bankName: bank?.name || ''});
                    }}
                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select your bank</option>
                    {BANKS.map((bank) => (
                      <option key={bank.code} value={bank.code}>{bank.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => {
                      setFormData({...formData, accountNumber: e.target.value, accountName: ''});
                      setResolved(false);
                    }}
                    className="flex-1 bg-[#2a2a2a] border border-gray-700 rounded-lg p-4 text-white focus:border-orange-500 focus:outline-none"
                    placeholder="Account Number (10 digits)"
                    maxLength={10}
                  />
                  <button
                    type="button"
                    onClick={handleResolveBank}
                    disabled={resolving || !formData.bankCode || formData.accountNumber.length !== 10}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium px-4 rounded-lg transition flex items-center gap-2"
                  >
                    {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {resolving ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                {formData.accountName && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-green-900/30 border border-green-500/30 rounded-lg p-4"
                  >
                    <p className="text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Account Name: <strong className="text-white">{formData.accountName}</strong>
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || formData.lpgTypes.length === 0 || !resolved}
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
