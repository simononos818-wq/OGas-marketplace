export default function SupportPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Support</h1>
      <p className="text-gray-400 mb-8">Need help with an order, payment, or your account? We're here to help.</p>

      <div className="space-y-6">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold mb-2">Order or Delivery Issues</h2>
          <p className="text-gray-300 text-sm">If your order hasn't arrived, or something seems wrong with a delivery, check your <a href="/orders" className="text-orange-500 underline">Orders page</a> first for the seller's contact number, or reach out to us directly below.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold mb-2">Payment Issues</h2>
          <p className="text-gray-300 text-sm">If a payment didn't go through or your order status hasn't updated after paying, contact us with your order reference so we can check the payment status.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-lg font-bold mb-2">Contact Us</h2>
          <p className="text-gray-300 text-sm mb-3">Email: <a href="mailto:support@ogaslpgmarketplace.com" className="text-orange-500 underline">support@ogaslpgmarketplace.com</a></p>
          <p className="text-gray-300 text-sm">We aim to respond within 24 hours.</p>
        </div>

        <div className="text-sm text-gray-500 pt-4">
          <a href="/terms" className="underline mr-4">Terms of Service</a>
          <a href="/privacy" className="underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
