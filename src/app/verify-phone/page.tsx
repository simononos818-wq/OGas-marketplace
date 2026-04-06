'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { setupRecaptcha, sendOTPToNigeria } from '@/lib/firebase';
import { Phone, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPhonePage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(60);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Setup invisible reCAPTCHA
      const appVerifier = setupRecaptcha('recaptcha-container');
      
      if (!appVerifier) {
        setError('Failed to initialize verification. Please refresh.');
        setLoading(false);
        return;
      }

      const result = await sendOTPToNigeria(phone, appVerifier);
      
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setStep('otp');
        setCountdown(60);
      } else {
        // Handle specific Firebase errors
        if (result.code === 'auth/invalid-phone-number') {
          setError('Invalid phone number. Use format: 08012345678 or +2348012345678');
        } else if (result.code === 'auth/too-many-requests') {
          setError('Too many attempts. Please try again later.');
        } else if (result.code === 'auth/captcha-check-failed') {
          setError('Verification failed. Please refresh and try again.');
        } else {
          setError(result.error || 'Failed to send OTP. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!confirmationResult) {
        setError('Session expired. Please request OTP again.');
        setLoading(false);
        return;
      }

      await confirmationResult.confirm(otp);
      
      // Update user profile to mark phone as verified
      // Redirect based on role
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith('+234')) return phone;
    if (phone.startsWith('0')) return '+234' + phone.substring(1);
    return '+234' + phone;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'phone' ? 'Verify Phone' : 'Enter OTP'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'phone' 
              ? 'We will send a verification code to your phone' 
              : `Code sent to ${formatPhoneDisplay(phone)}`}
          </p>
        </div>

        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container" className="absolute invisible"></div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Phone Step */}
        {step === 'phone' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter your Nigerian number starting with 0 or +234
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Didn't receive code? {' '}
                  {countdown > 0 ? (
                    <span className="text-gray-400">Resend in {countdown}s</span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>

            <button
              onClick={() => setStep('phone')}
              className="mt-4 w-full text-center text-gray-500 hover:text-gray-700 text-sm"
            >
              Change Phone Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
