'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setStandalone(isApp);
    if (isApp) return;
    if (localStorage.getItem('ogas-install-dismissed') === '1') return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    const t = setTimeout(() => setShow(true), 2500);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  if (standalone || !show) return null;

  const install = async () => {
    if (promptEvent) {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') setShow(false);
      setPromptEvent(null);
      return;
    }
    alert('Chrome: tap the menu (⋮) → Install app / Add to Home screen.');
  };

  const dismiss = () => {
    localStorage.setItem('ogas-install-dismissed', '1');
    setShow(false);
  };

  return (
    <div className="fixed left-0 right-0 z-[60] px-3" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
      <div className="max-w-lg mx-auto bg-white border rounded-2xl p-3 flex items-center gap-3 shadow-2xl" style={{ borderColor: '#e6e9ee' }}>
        <img src="/ogas-icon.svg" alt="OGas" className="w-11 h-11 rounded-full bg-white object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm" style={{ color: '#16305e' }}>Install OGas</p>
          <p className="text-[11px]" style={{ color: '#8a8f98' }}>Open like an Android app. No browser bar.</p>
        </div>
        <button onClick={install} className="text-white font-bold text-sm px-3 py-2 rounded-xl flex items-center gap-1" style={{ background: '#12a5b0' }}>
          <Download size={14} /> Install
        </button>
        <button onClick={dismiss} style={{ color: '#8a8f98' }} className="p-1" aria-label="Close">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
