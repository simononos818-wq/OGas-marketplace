import Link from 'next/link';

export default function TrustFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-[#0a2540] px-5 py-8 text-sm text-white/70">
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <p className="text-base font-bold text-white">OGas Ventures</p>
          <p className="mt-1">
            Nigeria&apos;s verified LPG marketplace — verified sellers, live per-kg
            prices, weigh-on-scale receipts.
          </p>
        </div>

        <div className="space-y-1">
          <p>RC/BN: <span className="text-white">CAC BN 9638951</span></p>
          <p>20 Ejumeghere Street, Oteri, Ughelli, Delta State, Nigeria</p>
          <p>
            WhatsApp:{' '}
            <a href="https://wa.me/2349133110237" className="text-[#2dd4c2] underline">
              0913 311 0237
            </a>
          </p>
          <p>
            Email:{' '}
            <a href="mailto:support@ogaslpgmarketplace.com" className="text-[#2dd4c2] underline">
              support@ogaslpgmarketplace.com
            </a>
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/sell" className="hover:text-white">Sell on OGas</Link>
          <Link href="/support" className="hover:text-white">Help</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </nav>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} OGas Ventures. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
