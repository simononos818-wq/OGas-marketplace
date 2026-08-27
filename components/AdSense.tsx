"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const BLOCK = [
  "/orders",
  "/chat",
  "/login",
  "/seller",
  "/profile",
  "/admin",
  "/buy",
  "/receipt",
];

const PUB = "ca-pub-7537556385111201";

export default function AdSense() {
  const path = usePathname() || "/";
  if (BLOCK.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
