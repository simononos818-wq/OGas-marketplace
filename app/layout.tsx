import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Logo } from "@/components/Logo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OGas - Gas Marketplace",
  description: "Connect with verified gas suppliers and customers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-slate-900 text-white`}>
        <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
            <Logo variant="icon" size="sm" animated />
            <span className="font-bold text-xl tracking-tight">OGas</span>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
