import type { Metadata } from "next";
import SellerPacksClient from "./SellerPacksClient";

export const metadata: Metadata = {
  title: "Start Your Gas Business | OGas Seller Starter Packs",
  description:
    "Join the OGas seller pack waitlist. Packages from ₦450,000 with filled branded 50kg C-Smart cylinders, weighing equipment, safety kit, practical training and seller onboarding. No payment today.",
  alternates: { canonical: "/seller/packs" },
  openGraph: {
    title: "Start Your Own Gas Business — OGas Seller Starter Packs",
    description:
      "Filled branded 50kg C-Smart cylinders + equipment + practical training + OGas seller onboarding. Waitlist packages from ₦450,000; no payment today.",
    url: "https://www.ogaslpgmarketplace.com/seller/packs",
    siteName: "OGas LPG Marketplace",
    type: "website",
  },
};

export default function SellerPacksPage() {
  return <SellerPacksClient />;
}
