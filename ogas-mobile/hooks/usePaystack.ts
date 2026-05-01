import { useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOrder } from "../contexts/OrderContext";

const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_live_YOUR_KEY";

export function usePaystack() {
  const { updatePaymentStatus } = useOrder();
  const [processing, setProcessing] = useState(false);

  const initializePayment = async (amount: number, email: string, orderId: string, onSuccess?: (ref: string) => void, onCancel?: () => void) => {
    setProcessing(true);
    try {
      const reference = "OGAS_" + orderId + "_" + Date.now();
      const amountInKobo = Math.round(amount * 100);

      const params = new URLSearchParams({
        email: email,
        amount: amountInKobo.toString(),
        reference: reference,
        public_key: PAYSTACK_PUBLIC_KEY,
        callback_url: "https://standard.paystack.co/close",
        metadata: JSON.stringify({ orderId, custom_fields: [] }),
        channels: "card,bank,ussd,qr,mobile_money"
      });

      const paystackUrl = "https://checkout.paystack.com/?" + params.toString();

      const result = await WebBrowser.openBrowserAsync(paystackUrl);
      setProcessing(false);

      if (result.type === "dismiss" || result.type === "cancel") {
        await updatePaymentStatus(orderId, "paid", reference);
        onSuccess?.(reference);
      } else {
        onCancel?.();
      }
    } catch (error) {
      setProcessing(false);
      Alert.alert("Payment Error", "Could not open payment page");
    }
  };

  return { initializePayment, processing };
}
