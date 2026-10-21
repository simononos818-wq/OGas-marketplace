import Link from 'next/link';
import { CONTACT, whatsappLink } from '../../lib/contact';

const linkCls = 'hover:text-white';

export default function TrustFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-[#0a2540] px-5 py-8 text-sm text-white/70">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <p className="text-base font-bold text-white">{CONTACT.brand}</p>
          <p className="mt-1">
            Nigeria&apos;s verified LPG marketplace: verified sellers, live per-kg
            prices, weigh-on-scale receipts, and escrow-protected payments.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <p className="mb-2 font-semibold text-[#2dd4c2]">Marketplace</p>
            <ul className="space-y-1.5">
              <li><Link href="/shops" className={linkCls}>Find a seller</Link></li>
              <li><Link href="/calculator" className={linkCls}>Gas calculator</Link></li>
              <li><Link href="/sell" className={linkCls}>Sell on OGas</Link></li>
              <li><Link href="/partners" className={linkCls}>Partners</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-[#2dd4c2]">Trust &amp; safety</p>
            <ul className="space-y-1.5">
              <li><Link href="/how-escrow-works" className={linkCls}>How escrow works</Link></li>
              <li><Link href="/safety" className={linkCls}>Gas safety</Link></li>
              <li><Link href="/about" className={linkCls}>About OGas</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-[#2dd4c2]">Support</p>
            <ul className="space-y-1.5">
              <li><Link href="/support" className={linkCls}>Help centre</Link></li>
              <li><Link href="/contact" className={linkCls}>Contact us</Link></li>
              <li><Link href="/terms" className={linkCls}>Terms</Link></li>
              <li><Link href="/privacy" className={linkCls}>Privacy</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-[#2dd4c2]">Reach us</p>
            <ul className="space-y-1.5">
              <li>
                <a href={whatsappLink()} className="text-[#2dd4c2] underline">
                  WhatsApp {CONTACT.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="break-all text-[#2dd4c2] underline">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
          <span className="font-semibold text-white">Smell gas?</span> Close the valve, open windows,
          switch off nothing electrical, use no flame or phone indoors, and move outside.{' '}
          <Link href="/safety" className="text-[#2dd4c2] underline">Safety guide</Link>
        </p>

        <div className="space-y-1 text-xs text-white/50">
          <p>{CONTACT.address}</p>
          <p>
            {CONTACT.brand} &bull; {CONTACT.registration} &bull; ogaslpgmarketplace.com
          </p>
          <p>&copy; {new Date().getFullYear()} {CONTACT.brand}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
