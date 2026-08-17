export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Privacy Policy</h1>
      <p className="text-gray-400 text-sm mb-6">Last updated: August 2026</p>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-2">1. What We Collect</h2>
          <p>To process your orders, we collect your name, phone number, delivery address, email (if provided), and order history. Payment card details are handled entirely by Paystack — OGas never sees or stores your full card number.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">2. How We Use Your Data</h2>
          <p>Your information is used to process orders, connect you with sellers for delivery, verify payments, and improve the OGas service. We do not sell your personal data to third parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">3. Sharing With Sellers</h2>
          <p>When you place an order, the seller you selected receives your name, phone number, and delivery address so they can fulfill and deliver your order.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">4. Data Storage</h2>
          <p>Order and account data is stored securely using Firebase (Google Cloud infrastructure) with access-controlled security rules.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">5. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us via the <a href="/support" className="text-orange-500 underline">Support page</a>.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-2">6. Contact</h2>
          <p>For privacy-related questions, reach us via the <a href="/support" className="text-orange-500 underline">Support page</a>.</p>
        </section>
      </div>
    </div>
  );
}
