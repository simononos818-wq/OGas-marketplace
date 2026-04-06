import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const ios = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const android = /Android/.test(userAgent);
      
      setIsMobile(mobile);
      setIsIOS(ios);
      setIsAndroid(android);
      
      // iOS viewport height fix
      if (ios) {
        const vh = window.innerHeight * 0.01;
        setVh(vh);
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isIOS, isAndroid, vh };
}

export function useKeyboard() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const originalHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const keyboardOpen = currentHeight < originalHeight * 0.75;
      setIsOpen(keyboardOpen);
      
      if (keyboardOpen) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          setTimeout(() => {
            active.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isOpen;
}
