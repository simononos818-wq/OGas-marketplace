'use client';

import { useState } from 'react';
import { Flame, Package, Plus, Minus, MapPin, CreditCard, Phone, AlertCircle } from 'lucide-react';

const gasProducts = [
  { id: '1', type: 'lpg', size: '3kg', price: 4500, name: '3kg LPG (Camping)', image: '/gas-3kg.png' },
  { id: '2', type: 'lpg', size: '5kg', price: 7500, name: '5kg LPG (Small Home)', image: '/gas-5kg.png' },
  { id: '3', type: 'lpg', size: '6kg', price: 9000, name: '6kg LPG', image: '/gas-6kg.png' },
  { id: '4', type: 'lpg', size: '12.5kg', price: 18500, name: '12.5kg LPG (Standard)', image: '/gas-12kg.png' },
  { id: '5', type: 'lpg', size: '25kg', price: 36500, name: '25kg LPG (Commercial)', image: '/gas-25kg.png' },
  { id: '6', type: 'lpg', size: '50kg', price: 72000, name: '50kg LPG (Industrial)', image: '/gas-50kg.png' },
];

const nigerianStates = [
  'Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Kaduna', 'Delta', 'Ogun', 'Anambra', 'Enugu'
];

export default function OrderPage() {
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [step, setStep] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: 'Lagos',
    landmark: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('paystack');

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => Object.values(cart).reduce((a, b) => a + b, 0);
  
  const getSubtotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = gasProducts.find(p => p.id === productId);
      return total + (product?.price || 0) * quantity;
    }, 0);
  };

  const deliveryFee = getSubtotal() > 20000 ? 0 : 1500;
  const total = getSubtotal() + deliveryFee;

  const handlePlaceOrder = () => {
    // Integrate Paystack here
    alert('Redirecting to Paystack payment...');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Gas</h1>
      
      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {['Select Gas', 'Delivery Details', 'Payment'].map((label, index) => (
          <div key={label} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step > index + 1 ? 'bg-green-500 text-white' : step === index + 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > index + 1 ? '✓' : index + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= index + 1 ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
            {index < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Gas */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gasProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-2xl font-bold text-orange-600">₦{product.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{product.size} cylinder</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cart[product.id] && (
                    <>
                      <button onClick={() => removeFromCart(product.id)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{cart[product.id]}</span>
                    </>
                  )}
                  <button onClick={() => addToCart(product.id)} className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Delivery Details */}
      {step === 2 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                placeholder="123 Adeola Odeku Street"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                  placeholder="Victoria Island"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {nigerianStates.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Landmark (Optional)</label>
              <input
                type="text"
                value={deliveryAddress.landmark}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})}
                placeholder="Near Eko Hotel"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
              <input
                type="tel"
                value={deliveryAddress.phone}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                placeholder="08012345678"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-3">
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'paystack' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              <input type="radio" name="payment" value="paystack" checked={paymentMethod === 'paystack'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-orange-500" />
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">Pay with Paystack</p>
                <p className="text-sm text-gray-500">Card, Bank Transfer, USSD</p>
              </div>
              <div className="w-12 h-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">PAY</div>
            </label>
            
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-orange-500" />
              <div className="ml-3">
                <p className="font-medium text-gray-900">Cash on Delivery</p>
                <p className="text-sm text-gray-500">Pay when gas is delivered</p>
              </div>
            </label>
          </div>

          {/* Order Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₦{getSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">{deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-orange-600">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary & Navigation */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{getTotalItems()} items</p>
              <p className="text-2xl font-bold text-gray-900">₦{total.toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (step < 3) {
                    setStep(step + 1);
                  } else {
                    handlePlaceOrder();
                  }
                }}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
              >
                {step === 3 ? 'Place Order' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
