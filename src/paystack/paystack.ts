// Paystack Integration for Nigeria
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

interface PaystackPaymentParams {
  email: string;
  amount: number; // in kobo (multiply Naira by 100)
  reference: string;
  metadata?: any;
  onSuccess?: (response: any) => void;
  onCancel?: () => void;
}

export const initializePaystackPayment = (params: PaystackPaymentParams) => {
  // @ts-ignore
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: params.email,
    amount: params.amount,
    currency: 'NGN',
    ref: params.reference,
    metadata: params.metadata || {},
    callback: function(response: any) {
      console.log('Payment successful:', response);
      params.onSuccess?.(response);
    },
    onClose: function() {
      console.log('Payment cancelled');
      params.onCancel?.();
    }
  });
  
  handler.openIframe();
};

export const generateReference = () => {
  return 'OGAS_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
};

// Convert Naira to Kobo for Paystack
export const nairaToKobo = (amountInNaira: number): number => {
  return Math.round(amountInNaira * 100);
};
