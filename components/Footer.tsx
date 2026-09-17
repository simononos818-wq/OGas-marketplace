import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full bg-[#0d3b1e] text-white mt-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-lg font-bold">OGas LPG Marketplace</p>
          <p className="text-sm text-green-100 mt-1">
            Nigeria's digital marketplace connecting cooking gas buyers with verified
            independent sellers — transparent per-kg prices, secure escrow payments, and
            doorstep or pickup delivery.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-green-200 mb-2">Company</p>
            <ul className="space-y-1 text-green-100">
              <li><Link href="/about" className="hover:underline">About OGas</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact Us</Link></li>
              <li><Link href="/support" className="hover:underline">Support</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-green-200 mb-2">Contact</p>
            <ul className="space-y-1 text-green-100">
              <li>OGas Ventures (Mega Think Success)</li>
              <li>20 Ejumeghere Street, Isodje, Oteri,</li>
              <li>Ughelli, Delta State, Nigeria</li>
              <li>
                <a href="https://wa.me/2349133110237" className="hover:underline">
                  WhatsApp: 0913 311 0237
                </a>
              </li>
              <li>
                <a href="mailto:support@ogaslpgmarketplace.com" className="hover:underline">
                  support@ogaslpgmarketplace.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-800 mt-6 pt-4 text-xs text-green-200 space-y-1">
          <p>
            OGas Ventures is a registered digital marketplace (internet services business)
            connecting LPG buyers with independent verified sellers across Nigeria.
          </p>
          <p>
            &copy; 2026 OGas Ventures. All rights reserved. &bull; CAC BN: 9638951 &bull;
            FIRS TIN: 2621012005709 &bull; ogaslpgmarketplace.com
          </p>
        </div>
      </div>
    </footer>
  )
}
