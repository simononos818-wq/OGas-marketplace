import { useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOrder } from "../contexts/OrderContext";

const PAYSTACK_PUBLIC_KEY = "pk_live_b73e1e169529e05ae4ba2272fb7f7937d226be3c";
const VERIFY_URL = "https://paymentverify-5ce45g6w3q-uc.a.run.app";

export function usePaystack() {
  const { updatePaymentStatus } = useOrder();
  const [processing, setProcessing] = useState(false);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const checkPaymentStatus = async (reference: string, retries = 5): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${VERIFY_URL}?reference=${reference}`);
        const data = await response.json();
        if (data.status && data.data.status === "success") {
          return true;
        }
      } catch (error) {
        console.log("Verify attempt failed, retrying...", error);
      }
      await sleep(3000);
    }
    return false;
  };

  const initializePayment = async (
    amount: number, 
    email: string, 
    orderId: string, 
    onSuccess?: (ref: string) => void, 
    onCancel?: () => void
  ) => {
    setProcessing(true);
    const reference = "OGAS_" + orderId + "_" + Date.now();
    
    try {
      await updatePaymentStatus(orderId, "pending", reference);
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
      await WebBrowser.openBrowserAsync(paystackUrl);
      setProcessing(false);

      Alert.alert("Checking Payment...", "Please wait while we verify your payment.", [{ text: "OK" }]);
      const isPaid = await checkPaymentStatus(reference);

      if (isPaid) {
        await updatePaymentStatus(orderId, "paid", reference);
        onSuccess?.(reference);
      } else {
        Alert.alert(
          "Payment Not Confirmed",
          "We could not confirm your payment yet. If you completed payment, it will appear in your orders shortly.",
          [{ text: "OK", onPress: () => onCancel?.() }]
        );
      }
    } catch (error) {
      setProcessing(false);
      console.error("Payment error:", error);
      Alert.alert("Payment Error", "Could not process payment. Please try again.");
    }
  };

  return { initializePayment, processing };
}
