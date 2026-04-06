"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, ShoppingCart, Phone, MapPin, Star, Clock, X, Plus, Minus, Search, User, Home, ChevronDown, Zap
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  type: "cylinder" | "refill";
  name: string;
  size: string;
  price: number;
  stock: number;
}

interface Seller {
  id: string;
  name: string;
  location: string;
  phone: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  deliveryFee: number;
  verified: boolean;
  products: Product[];
}

interface CartItem {
  sellerId: string;
  sellerName: string;
  product: Product;
  quantity: number;
  deliveryFee: number;
}

const sellers: Seller[] = [
  {
    id: "1",
    name: "Mega Think Success",
    location: "Isodje Street, Ughelli",
    phone: "+2348077778888",
    rating: 4.8,
    reviews: 124,
    deliveryTime: "15-30 mins",
    deliveryFee: 200,
    verified: true,
    products: [
      { id: "1", type: "cylinder", name: "3kg Cylinder + Gas", size: "3kg", price: 9200, stock: 15 },
      { id: "2", type: "cylinder", name: "6kg Cylinder + Gas", size: "6kg", price: 16500, stock: 8 },
      { id: "3", type: "cylinder", name: "12.5kg Cylinder + Gas", size: "12.5kg", price: 31000, stock: 12 },
      { id: "4", type: "refill", name: "3kg Refill", size: "3kg", price: 1300, stock: 50 },
      { id: "5", type: "refill", name: "6kg Refill", size: "6kg", price: 2600, stock: 40 },
      { id: "6", type: "refill", name: "12.5kg Refill", size: "12.5kg", price: 5500, stock: 35 },
    ],
  },
  {
    id: "2",
    name: "Mama Nkechi Gas Shop",
    location: "Ughelli Main Market",
    phone: "+2348077773333",
    rating: 4.5,
    reviews: 89,
    deliveryTime: "20 mins",
    deliveryFee: 0,
    verified: true,
    products: [
      { id: "7", type: "cylinder", name: "3kg Cylinder + Gas", size: "3kg", price: 9500, stock: 8 },
      { id: "8", type: "cylinder", name: "6kg Cylinder + Gas", size: "6kg", price: 17000, stock: 5 },
      { id: "9", type: "cylinder", name: "12.5kg Cylinder + Gas", size: "12.5kg", price: 32500, stock: 6 },
      { id: "10", type: "refill", name: "3kg Refill", size: "3kg", price: 1400, stock: 20 },
      { id: "11", type: "refill", name: "6kg Refill", size: "6kg", price: 2800, stock: 15 },
      { id: "12", type: "refill", name: "12.5kg Refill", size: "12.5kg", price: 5800, stock: 12 },
    ],
  },
  {
    id: "3",
    name: "Oteri Gas Point",
    location: "Oteri Junction, Ughelli",
    phone: "+2348088884444",
    rating: 4.6,
    reviews: 67,
    deliveryTime: "15 mins",
    deliveryFee: 300,
    verified: true,
    products: [
      { id: "13", type: "cylinder", name: "3kg Cylinder + Gas", size: "3kg", price: 9000, stock: 20 },
      { id: "14", type: "cylinder", name: "6kg Cylinder + Gas", size: "6kg", price: 16200, stock: 15 },
      { id: "15", type: "cylinder", name: "12.5kg Cylinder + Gas", size: "12.5kg", price: 30500, stock: 18 },
      { id: "16", type: "refill", name: "3kg Refill", size: "3kg", price: 1280, stock: 30 },
      { id: "17", type: "refill", name: "6kg Refill", size: "6kg", price: 2550, stock: 25 },
      { id: "18", type: "refill", name: "12.5kg Refill", size: "12.5kg", price: 5400, stock: 20 },
    ],
  },
  {
    id: "4",
    name: "Robor Energy Direct",
    location: "Ughelli Express Road",
    phone: "+2348031234567",
    rating: 4.9,
    reviews: 312,
    deliveryTime: "30 mins",
    deliveryFee: 500,
    verified: true,
    products: [
      { id: "19", type: "cylinder", name: "3kg Cylinder", size: "3kg", price: 7800, stock: 50 },
      { id: "20", type: "cylinder", name: "6kg Cylinder", size: "6kg", price: 14200, stock: 40 },
      { id: "21", type: "cylinder", name: "12.5kg Cylinder", size: "12.5kg", price: 26500, stock: 35 },
      { id: "22", type: "refill", name: "3kg Refill", size: "3kg", price: 1100, stock: 100 },
      { id: "23", type: "refill", name: "6kg Refill", size: "6kg", price: 2200, stock: 80 },
      { id: "24", type: "refill", name: "12.5kg Refill", size: "12.5kg", price: 4800, stock: 60 },
    ],
  },
];

const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

export default function Marketplace() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const addToCart = (seller: Seller, product: Product) => {
    const existing = cart.find(item => item.sellerId === seller.id && item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.sellerId === seller.id && item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        sellerId: seller.id,
        sellerName: seller.name,
        product,
        quantity: 1,
        deliveryFee: seller.deliveryFee
      }]);
    }
  };

  const removeFromCart = (sellerId: string, productId: string) => {
    setCart(cart.filter(item => !(item.sellerId === sellerId && item.product.id === productId)));
  };

  const updateQuantity = (sellerId: string, productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.sellerId === sellerId && item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity) + item.deliveryFee, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = () => {
    setOrderSuccess(true);
    setCart([]);
    setTimeout(() => {
      setOrderSuccess(false);
      setIsCartOpen(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OGAS</h1>
              <p className="text-xs text-gray-500">Gas Delivery</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-8 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fast Gas Delivery</h2>
          <p className="text-gray-600 mb-4">Get your gas cylinder or refill delivered in 15-30 minutes</p>
          <div className="flex gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-semibold text-orange-600">Best prices in Ughelli</span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sellers or products..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Sellers Grid */}
        <div className="space-y-4">
          {sellers.map((seller) => (
            <div key={seller.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
              {/* Seller Info */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{seller.name}</h3>
                      {seller.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {seller.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {seller.rating} ({seller.reviews})
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {seller.deliveryTime}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.location.href = `tel:${seller.phone}`}
                    className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Products */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {seller.products.slice(0, 4).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{formatPrice(product.price)}</p>
                      </div>
                      <button 
                        onClick={() => addToCart(seller, product)}
                        disabled={product.stock === 0}
                        className="px-3 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
                {seller.products.length > 4 && (
                  <button 
                    onClick={() => setSelectedSeller(seller)}
                    className="w-full py-2 text-orange-600 font-semibold hover:text-orange-700 transition"
                  >
                    View all {seller.products.length} products →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedSeller && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedSeller(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-h-[90vh] rounded-t-3xl overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedSeller.name}</h2>
                <button onClick={() => setSelectedSeller(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                {selectedSeller.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{formatPrice(product.price)} • {product.stock} in stock</p>
                    </div>
                    <button 
                      onClick={() => { addToCart(selectedSeller, product); setSelectedSeller(null); }}
                      disabled={product.stock === 0}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-sm text-orange-600 font-semibold">{item.sellerName}</p>
                            <p className="font-semibold text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-600">{formatPrice(item.product.price)} each</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.sellerId, item.product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button 
                              onClick={() => updateQuantity(item.sellerId, item.product.id, -1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-semibold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.sellerId, item.product.id, 1)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="font-bold text-gray-900">{formatPrice(item.product.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>{formatPrice(cart.reduce((sum, item) => sum + item.deliveryFee, 0))}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={placeOrder}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition"
                  >
                    Place Order
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 text-center max-w-sm"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h3>
              <p className="text-gray-600 mb-6">The seller will contact you shortly to confirm delivery.</p>
              <button 
                onClick={() => setOrderSuccess(false)}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                Continue Shopping
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-around">
          <Link href="/" className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-600 hover:text-orange-600 transition">
            <Home className="w-6 h-6" />
            <span className="text-xs font-semibold">Home</span>
          </Link>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-600 hover:text-orange-600 transition relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-semibold">Cart</span>
            {itemCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
          <Link href="/auth" className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-600 hover:text-orange-600 transition">
            <User className="w-6 h-6" />
            <span className="text-xs font-semibold">Account</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
