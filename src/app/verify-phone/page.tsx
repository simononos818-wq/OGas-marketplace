'use client';

import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowLeft, MapPin } from 'lucide-react';

export default function VerifyPhone() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const router = useRouter();

  // Get user location on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('Location obtained:', position.coords);
        },
        (err) => {
          console.error('Location error:', err);
          setLocationError('Please enable location access to find nearby sellers');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (typeof window !== 'undefined' && step === 'phone' && !recaptchaVerifierRef.current) {
      try {
        // Clear any existing reCAPTCHA
        const existingContainer = document.getElementById('recaptcha-container');
        if (existingContainer) {
          existingContainer.innerHTML = '';
        }

        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response: any) => {
            console.log('reCAPTCHA verified:', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            setError('reCAPTCHA expired. Please try again.');
          }
        });

        recaptchaVerifierRef.current = verifier;
        console.log('reCAPTCHA initialized');
      } catch (err) {
        console.error('Error initializing reCAPTCHA:', err);
        setError('Failed to initialize verification. Please refresh.');
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [step]);

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+234' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+234' + cleaned;
    }
    return cleaned;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!recaptchaVerifierRef.current) {
        throw new Error('Verification not ready. Please refresh the page.');
      }

      const formattedPhone = formatPhoneNumber(phone);
      console.log('Sending OTP to:', formattedPhone);

      // CRITICAL: Pass the recaptchaVerifier as 3rd argument
      const confirmation = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        recaptchaVerifierRef.current
      );
      
      setConfirmationResult(confirmation);
      setStep('otp');
      console.log('OTP sent successfully');
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Use format: 08012345678');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('Verification failed. Please refresh and try again.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }

      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
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
        throw new Error('No verification in progress. Please request OTP again.');
      }

      const result = await confirmationResult.confirm(otp);
      console.log('Phone auth successful:', result.user);
      
      // Store location in user profile if available
      if (location) {
        // You can save this to Firestore here
        console.log('User location:', location);
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <Link href="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Phone Verification' : 'Enter OTP'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'phone' 
              ? 'Enter your Nigerian phone number to receive a verification code'
              : `Enter the 6-digit code sent to ${phone}`
            }
          </p>
        </div>

        {/* Location Status */}
        {location && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">Location detected</span>
          </div>
        )}
        {locationError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-sm text-yellow-700">{locationError}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter your Nigerian number starting with 0
              </p>
            </div>

            {/* CRITICAL: reCAPTCHA container */}
            <div id="recaptcha-container"></div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors text-center text-2xl tracking-widest"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
                recaptchaVerifierRef.current = null;
              }}
              className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Test number: <strong>+2348012345678</strong></p>
          <p>Test code: <strong>123456</strong></p>
        </div>
      </div>
    </div>
  );
}
