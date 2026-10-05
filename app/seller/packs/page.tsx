import type { Metadata } from "next";
import SellerPacksClient from "./SellerPacksClient";

export const metadata: Metadata = {
  title: "Start Your Gas Business | OGas Seller Starter Packs",
  description:
    "Complete gas business packages from ₦500,000: 47kg Calor cylinder, digital scale, safety kit, FREE one-day training, live OGas shop and 3 months commission-free trading. First 10 buyers save ₦50,000.",
  openGraph: {
    title: "Start Your Own Gas Business — OGas Seller Starter Packs",
    description:
      "Equipment + FREE training + your own online shop + 3 months commission-free. From ₦500,000.",
    url: "https://ogaslpgmarketplace.com/seller/packs",
    siteName: "OGas LPG Marketplace",
    type: "website",
  },
};

export default function SellerPacksPage() {
  return <SellerPacksClient />;
}
