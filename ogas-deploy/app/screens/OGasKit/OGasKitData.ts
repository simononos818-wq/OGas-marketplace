export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: any;
  category: 'cylinder' | 'accessory' | 'safety' | 'kit' | 'equipment';
  description: string;
  features: string[];
  inStock: boolean;
  rating: number;
  salesCount: number;
  weight?: string;
  warranty?: string;
}

export interface Kit {
  id: string;
  name: string;
  subtitle: string;
  products: string[];
  totalPrice: number;
  discount: number;
  finalPrice: number;
  badge?: string;
  popular?: boolean;
}

export interface CalculatorInput {
  cylinderSize: number;
  buyPricePerKg: number;
  sellPricePerKg: number;
  dailySalesKg: number;
  kitPrice: number;
}

export interface CalculatorResult {
  profitPerKg: number;
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  yearlyProfit: number;
  monthsToROI: number;
  breakEvenDays: number;
}

export const OGasColors = {
  primary: '#FF6B35',
  secondary: '#E63946',
  accent: '#F4A261',
  dark: '#1A1A2E',
  darker: '#0F0F1A',
  card: '#16213E',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  success: '#2ECC71',
  warning: '#F1C40F',
  danger: '#E74C3C',
  border: '#2A2A4A',
};

export const products: Product[] = [
  {
    id: 'cyl-50',
    name: '50kg OGas Branded Cylinder',
    price: 250000,
    originalPrice: 280000,
    image: require('../../../assets/images/ogas-cylinder.png'),
    category: 'cylinder',
    description: 'Premium 50kg LPG cylinder with official OGas branding. Perfect for commercial gas retail business. Certified, durable, and ready for immediate use.',
    features: [
      'OGas official branding for instant recognition',
      '50kg capacity - ideal for commercial sales',
      'High-grade steel construction',
      'Rust-resistant coating',
      'Safety valve included',
      '6-month warranty',
      'Nationwide delivery available'
    ],
    inStock: true,
    rating: 5.0,
    salesCount: 12,
    weight: '50kg',
    warranty: '6 months'
  },
  {
    id: 'cyl-25',
    name: '25kg OGas Branded Cylinder',
    price: 140000,
    image: require('../../../assets/images/ogas-cylinder.png'),
    category: 'cylinder',
    description: 'Mid-size 25kg LPG cylinder with OGas branding. Great for smaller retail operations or backup storage.',
    features: [
      'OGas official branding',
      '25kg capacity',
      'Portable yet commercial-grade',
      'Safety certified',
      '3-month warranty'
    ],
    inStock: true,
    rating: 4.8,
    salesCount: 8,
    weight: '25kg',
    warranty: '3 months'
  },
  {
    id: 'hose-1m',
    name: 'LPG Gas Hose (Per Meter)',
    price: 2500,
    image: require('../../../assets/images/ogas-hose.png'),
    category: 'accessory',
    description: 'High-pressure LPG gas hose. Flexible, durable, and kink-resistant.',
    features: [
      'High-pressure rated',
      'Kink-resistant',
      'UV protected',
      'Standard LPG fittings compatible',
      'Sold per meter'
    ],
    inStock: true,
    rating: 4.5,
    salesCount: 45
  },
  {
    id: 'reg-std',
    name: 'Standard Gas Regulator',
    price: 4500,
    image: require('../../../assets/images/ogas-regulator.png'),
    category: 'accessory',
    description: 'Precision gas flow regulator. Controls gas pressure for safe and efficient usage.',
    features: [
      'Precision flow control',
      'Universal cylinder fitting',
      'Safety shut-off feature',
      'Durable brass construction',
      'Leak-proof design'
    ],
    inStock: true,
    rating: 4.7,
    salesCount: 32
  },
  {
    id: 'valve-safety',
    name: 'Safety Gas Valve',
    price: 3500,
    image: require('../../../assets/images/ogas-valve.png'),
    category: 'safety',
    description: 'Emergency shut-off valve for LPG systems. Essential safety component.',
    features: [
      'Instant shut-off capability',
      'Corrosion resistant',
      'Easy to operate',
      'Standard threading',
      'Safety certified'
    ],
    inStock: true,
    rating: 4.6,
    salesCount: 28
  },
  {
    id: 'scale-digital',
    name: 'Digital Gas Scale',
    price: 15000,
    image: require('../../../assets/images/ogas-scale.png'),
    category: 'equipment',
    description: 'Professional digital scale for accurate gas measurement. Essential for transparent business operations.',
    features: [
      'High precision digital display',
      '50kg+ capacity',
      'Tare function',
      'Battery operated',
      'Portable design',
      'Customer display for transparency'
    ],
    inStock: true,
    rating: 4.9,
    salesCount: 15
  },
  {
    id: 'extinguisher',
    name: 'Fire Extinguisher (2kg)',
    price: 8500,
    image: require('../../../assets/images/ogas-extinguisher.png'),
    category: 'safety',
    description: 'Compact ABC fire extinguisher. Mandatory safety equipment for LPG businesses.',
    features: [
      'ABC rated - handles all fire types',
      'Compact 2kg size',
      'Wall mount included',
      'Annual inspection sticker',
      'Easy operation instructions'
    ],
    inStock: true,
    rating: 4.8,
    salesCount: 20
  }
];

export const kits: Kit[] = [
  {
    id: 'kit-basic',
    name: '🔥 Basic Starter Kit',
    subtitle: 'Everything to start selling gas',
    products: ['cyl-50', 'hose-1m', 'reg-std'],
    totalPrice: 257000,
    discount: 7000,
    finalPrice: 250000,
    badge: 'Most Popular'
  },
  {
    id: 'kit-standard',
    name: '🔥 Standard Business Kit',
    subtitle: 'Complete setup with safety gear',
    products: ['cyl-50', 'hose-1m', 'reg-std', 'valve-safety', 'extinguisher'],
    totalPrice: 268500,
    discount: 18500,
    finalPrice: 250000,
    badge: 'Best Value',
    popular: true
  },
  {
    id: 'kit-premium',
    name: '🔥 Premium Entrepreneur Kit',
    subtitle: 'Full commercial operation',
    products: ['cyl-50', 'cyl-25', 'hose-1m', 'reg-std', 'valve-safety', 'scale-digital', 'extinguisher'],
    totalPrice: 433500,
    discount: 83500,
    finalPrice: 350000,
    badge: 'Complete Setup'
  }
];

export const calculateROI = (input: CalculatorInput): CalculatorResult => {
  const { buyPricePerKg, sellPricePerKg, dailySalesKg, kitPrice } = input;
  
  const profitPerKg = sellPricePerKg - buyPricePerKg;
  const dailyProfit = profitPerKg * dailySalesKg;
  const weeklyProfit = dailyProfit * 6;
  const monthlyProfit = weeklyProfit * 4.33;
  const yearlyProfit = monthlyProfit * 12;
  
  const monthsToROI = kitPrice / monthlyProfit;
  const breakEvenDays = Math.ceil(kitPrice / dailyProfit);
  
  return {
    profitPerKg,
    dailyProfit,
    weeklyProfit,
    monthlyProfit,
    yearlyProfit,
    monthsToROI: Math.ceil(monthsToROI * 10) / 10,
    breakEvenDays
  };
};

export const waybillCosts: Record<string, number> = {
  'Delta State': 3000,
  'Lagos': 12000,
  'Port Harcourt': 8000,
  'Abuja': 15000,
  'Benin': 5000,
  'Warri': 2500,
  'Asaba': 3500,
  'Onitsha': 6000,
  'Owerri': 7000,
  'Calabar': 9000,
  'Uyo': 8500,
  'Other': 10000
};

export const outreachScripts = {
  whatsappBroadcast: `🔥 START YOUR LPG BUSINESS TODAY 🔥

Are you looking for a profitable business with daily cash flow?

OGas has everything you need:

✅ 50kg Branded Cylinders - ₦250,000
✅ Complete Starter Kits from ₦250,000
✅ All accessories: hoses, regulators, valves, scales
✅ Nationwide delivery
✅ 6-month warranty
✅ Business support included

💡 Use our Smart Calculator to see your earnings before you buy!

📍 Pickup in Ughelli, Delta State
🚚 Waybill to any state

Message me now or download OGas app to order.

#OGas #LPGBusiness #StartToday #DeltaState`,

  facebookPost: `🔥 START YOUR OWN GAS BUSINESS - COMPLETE KITS AVAILABLE 🔥

Tired of looking for jobs? Start selling gas! Daily cash flow, high demand, recession-proof.

WHAT YOU GET:
🛢️ 50kg OGas Branded Cylinder
🔧 Regulator, Hose, Valve
🧯 Fire Safety Equipment  
⚖️ Digital Scale
📱 Business setup guide

PRICES:
• Basic Kit: ₦250,000
• Standard Kit: ₦250,000 (BEST VALUE)
• Premium Kit: ₦350,000

WHY OGas?
✓ Branded cylinders for instant recognition
✓ 6-month warranty
✓ Nationwide delivery
✓ Smart profit calculator
✓ Ongoing business support

📍 Ughelli, Delta State
🚚 We waybill to Lagos, PH, Abuja, anywhere!

💬 DM me to order.

#GasBusiness #Entrepreneurship #DeltaState #OGas #LPG`,

  directMessage: `Hi! I saw you're interested in starting a business. 

I sell complete LPG starter kits through OGas - everything you need to start selling gas and earning daily.

50kg branded cylinder + all accessories from ₦250,000.

I can waybill to your location, or you pickup in Ughelli.

Want to see how much you can earn? I have a calculator that shows your profit before you buy.

Interested?`,

  referralScript: `🎉 REFER & EARN ₦5,000 🎉

Know someone who wants to start a gas business?

Refer them to OGas. When they buy a starter kit, you get ₦5,000 cash!

No limit. Refer 10 people = ₦50,000.

Share this message with your contacts now.

Message me to get your referral code.`
};
