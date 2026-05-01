"use client";

import { useState, useEffect, FormEvent } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { app } from "@/lib/firebase";
import Link from "next/link";

export default function BuyerRegister() {
  const [phone, setPhone] = useState(""); // Empty - no default number
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const auth = getAuth(app);

  // Initialize reCAPTCHA once on mount [^114^]
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
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
      // Format phone number
      const formattedPhone = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;
      
      const confirmation = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        (window as any).recaptchaVerifier
      );
      
      setConfirmationResult(confirmation);
      setStep(2);
      alert("OTP sent successfully!");
    } catch (err) {
      console.error("OTP Error:", err);
      setError(err.message);
      
      // Reset reCAPTCHA on error [^114^]
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await confirmationResult.confirm(otp);
      alert("Phone verified! Registration complete.");
      // Redirect to home or dashboard
      window.location.href = "/";
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-md mx-auto pt-12">
        <Link href="/" className="text-green-400 mb-4 inline-block">← Back</Link>
        
        <h1 className="text-3xl font-bold mb-2">Buyer Registration</h1>
        <p className="text-gray-400 mb-8">Create your OGas account</p>

        {step === 1 ? (
          <form onSubmit={sendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone} // Controlled input - no default value [^118^]
                onChange={(e) => setPhone(e.target.value)}
                placeholder="8012345678"
                className="w-full p-3 rounded-lg bg-white text-black border-2 border-green-500 focus:outline-none focus:border-green-600"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: +2348012345678</p>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>

            {/* Invisible reCAPTCHA container [^114^] */}
            <div id="recaptcha-container"></div>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full p-3 rounded-lg bg-white text-black border-2 border-green-500 focus:outline-none focus:border-green-600"
                maxLength={6}
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
