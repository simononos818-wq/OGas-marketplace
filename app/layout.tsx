export const metadata = {
  title: 'OGas - Gas Delivery Nigeria',
  description: 'Order cooking gas delivery anywhere in Nigeria',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white antialiased">{children}</body>
    </html>
  )
}
