"use client";

import { useState, useEffect, FormEvent } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";
import { Phone, ArrowRight, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function BuyerRegister() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const auth = getAuth(app);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response: string) => {
          console.log("reCAPTCHA verified", response);
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired");
        }
      });
    }
  }, [auth]);

  const sendOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formattedPhone = phoneNumber.startsWith("+") 
        ? phoneNumber 
        : "+234" + phoneNumber.replace(/^0/, "");

      const confirmation = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        (window as any).recaptchaVerifier
      );

      setConfirmationResult(confirmation);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      setLoading(false);
    }
  };

  const verifyOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await confirmationResult.confirm(otp);
      setLoading(false);
      // Redirect to buyer dashboard
      window.location.href = "/buyer/dashboard";
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Buyer Registration</h1>
          <p className="text-slate-400">Create your OGas buyer account</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
          {!confirmationResult ? (
            <form onSubmit={sendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="08012345678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : "Send OTP"}
                <ArrowRight className="w-5 h-5" />
              </button>

              <div id="recaptcha-container"></div>
            </form>
          ) : (
            <form onSubmit={verifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold py-3 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Verifying..." : "Verify OTP"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <p className="text-center text-slate-500 text-sm mt-4">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-orange-400 hover:text-orange-300">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
