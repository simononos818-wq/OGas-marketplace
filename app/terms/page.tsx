export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Terms of Service</h1>
      <p className="text-gray-400 text-sm mb-6">Last updated: August 2026</p>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. About OGas</h2>
          <p>OGas LPG Marketplace ("OGas", "we", "us") connects buyers with independent LPG (cooking gas) sellers across Delta State, Nigeria. We are a marketplace platform, not the seller of the gas itself — each order is fulfilled by the seller you choose.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. Placing an Order</h2>
          <p>When you place an order, you agree to provide accurate delivery details and to pay the listed price plus any applicable delivery fee. Orders can be paid via card/bank transfer (Paystack) or cash on delivery, depending on what the seller supports.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. Payments</h2>
          <p>Card and bank payments are processed securely through Paystack. OGas does not store your card details. Once a payment is verified, your order is confirmed and the seller is notified to prepare delivery.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. Delivery &amp; Confirmation</h2>
          <p>You are responsible for confirming receipt of your gas order in the app once delivered. This confirmation releases payment to the seller. Please only confirm once you have physically received your order.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Cancellations &amp; Refunds</h2>
          <p>Orders may be cancelled before a seller confirms preparation. If a payment was made and the order cannot be fulfilled, contact Support for a refund review.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">6. Limitation of Liability</h2>
          <p>OGas facilitates connections between buyers and independent sellers. We are not liable for delays, product quality issues, or disputes arising directly between a buyer and a seller, though we will assist in good faith to resolve issues.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">7. Contact</h2>
          <p>Questions about these terms? Reach us via the <a href="/support" className="text-orange-500 underline">Support page</a>.</p>
        </section>
      </div>
    </div>
  );
}
