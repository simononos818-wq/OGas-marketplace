export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#16305e] p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[#12a5b0]">Support</h1>
      <p className="text-[#8a8f98] mb-8">Need help with an order, payment, or your account? We're here to help.</p>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e6e9ee]">
          <h2 className="text-lg font-bold mb-2">Order or Delivery Issues</h2>
          <p className="text-[#8a8f98] text-sm">If your order hasn't arrived, or something seems wrong with a delivery, check your <a href="/orders" className="text-[#12a5b0] underline">Orders page</a> first for the seller's contact number, or reach out to us directly below.</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e6e9ee]">
          <h2 className="text-lg font-bold mb-2">Payment Issues</h2>
          <p className="text-[#8a8f98] text-sm">If a payment didn't go through or your order status hasn't updated after paying, contact us with your order reference so we can check the payment status.</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e6e9ee]">
          <h2 className="text-lg font-bold mb-2">Contact Us</h2>
          <p className="text-[#8a8f98] text-sm mb-3">Email: <a href="mailto:support@ogaslpgmarketplace.com" className="text-[#12a5b0] underline">support@ogaslpgmarketplace.com</a></p>
          <p className="text-[#8a8f98] text-sm">We aim to respond within 24 hours.</p>
        </div>

        <div className="text-sm text-[#8a8f98] pt-4">
          <a href="/terms" className="underline mr-4">Terms of Service</a>
          <a href="/privacy" className="underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
