"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Shield, ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
}

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  advertising: false,
  functional: false,
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function GDPRConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);

  useEffect(() => {
    const stored = localStorage.getItem("ogas-gdpr-consent");
    if (!stored) {
      setShowBanner(true);
    } else {
      const parsed = JSON.parse(stored);
      updateGtagConsent(parsed);
    }
  }, []);

  const updateGtagConsent = (prefs: ConsentPreferences) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        ad_storage: prefs.advertising ? "granted" : "denied",
        analytics_storage: prefs.analytics ? "granted" : "denied",
        functionality_storage: prefs.functional ? "granted" : "denied",
        personalization_storage: prefs.advertising ? "granted" : "denied",
        security_storage: "granted",
      });
    }
  };

  const handleAcceptAll = () => {
    const allGranted = { necessary: true, analytics: true, advertising: true, functional: true };
    localStorage.setItem("ogas-gdpr-consent", JSON.stringify(allGranted));
    updateGtagConsent(allGranted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const minimal = { necessary: true, analytics: false, advertising: false, functional: false };
    localStorage.setItem("ogas-gdpr-consent", JSON.stringify(minimal));
    updateGtagConsent(minimal);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("ogas-gdpr-consent", JSON.stringify(preferences));
    updateGtagConsent(preferences);
    setShowBanner(false);
  };

  const togglePreference = (key: keyof ConsentPreferences) => {
    if (key === "necessary") return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-dark-card/95 backdrop-blur-lg border-t border-brand-500/30 shadow-2xl"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">We value your privacy</h3>
                <p className="text-dark-text text-sm">
                  We use cookies to provide you with a better experience, including personalized ads. 
                  By clicking Accept All, you consent to our use of cookies for advertising and analytics.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowDetails(!showDetails)}
                rightIcon={showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              >
                {showDetails ? "Hide" : "Manage"}
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleRejectAll}
                className="border-red-500/30 text-red-400 hover:text-red-300"
              >
                Reject All
              </Button>
              <Button 
                size="sm" 
                onClick={handleAcceptAll}
                className="bg-gradient-to-r from-brand-500 to-flame"
              >
                Accept All
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4 pt-4 border-t border-dark-border"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-dark-lighter rounded-xl border border-dark-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-white font-medium">Necessary</span>
                      </div>
                      <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">Required</span>
                    </div>
                    <p className="text-dark-text text-sm">Essential for the website to function properly.</p>
                  </div>

                  {["analytics", "advertising", "functional"].map((key) => (
                    <button 
                      key={key}
                      onClick={() => togglePreference(key as keyof ConsentPreferences)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        preferences[key as keyof ConsentPreferences]
                          ? "bg-brand-500/10 border-brand-500/50" 
                          : "bg-dark-lighter border-dark-border"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium capitalize">{key}</span>
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center",
                          preferences[key as keyof ConsentPreferences] ? "bg-brand-500 border-brand-500" : "border-dark-text"
                        )}>
                          {preferences[key as keyof ConsentPreferences] && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <p className="text-dark-text text-sm">
                        {key === "analytics" && "Helps us understand how visitors interact with our website."}
                        {key === "advertising" && "Used to deliver personalized advertisements."}
                        {key === "functional" && "Enables enhanced functionality and personalization."}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="secondary" size="sm" onClick={() => setShowDetails(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSavePreferences}>Save Preferences</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
