#!/bin/bash

echo "=== OGas Branding Fix Script ==="
echo "Buyers = OGas | Sellers = OGas Marketplace"
echo ""

# BUYER PAGES - Change to "OGas" only
buyer_files=(
  "./app/page.tsx"
  "./app/marketplace/page.tsx"
  "./app/products/page.tsx"
  "./app/orders/page.tsx"
  "./app/tracking/page.tsx"
  "./app/price-comparison/page.tsx"
  "./app/auth/page.tsx"
  "./app/success/page.tsx"
  "./components/Header.tsx"
  "./components/Navbar.tsx"
  "./components/Footer.tsx"
  "./app/layout.tsx"
)

# SELLER PAGES - Keep/Change to "OGas Marketplace"
seller_files=(
  "./app/seller-dashboard/page.tsx"
  "./app/seller-signup/page.tsx"
  "./app/seller-admin/page.tsx"
  "./app/admin/page.tsx"
  "./app/admin-commissions/page.tsx"
  "./app/admin-transactions/page.tsx"
  "./app/admin/commissions/page.tsx"
  "./components/SellerHeader.tsx"
  "./components/SellerNav.tsx"
)

echo "Updating BUYER files to 'OGas'..."
for file in "${buyer_files[@]}"; do
  if [ -f "$file" ]; then
    sed -i '' 's/OGas Marketplace/OGas/g' "$file"
    sed -i '' 's/OGasMarketplace/OGas/g' "$file"
    echo "✓ $file -> OGas"
  fi
done

echo ""
echo "Updating SELLER files to 'OGas Marketplace'..."
for file in "${seller_files[@]}"; do
  if [ -f "$file" ]; then
    # First ensure it's not already correct, then fix
    sed -i '' 's/OGas Marketplace/OGas Marketplace/g' "$file"
    sed -i '' 's/OGas"/OGas Marketplace"/g' "$file"
    sed -i '' "s/OGas'/OGas Marketplace'/g" "$file"
    # Fix any double replacements
    sed -i '' 's/OGas Marketplace Marketplace/OGas Marketplace/g' "$file"
    echo "✓ $file -> OGas Marketplace"
  fi
done

echo ""
echo "=== Updating HTML/meta files ==="

# Update layout.tsx or head metadata
if [ -f "./app/layout.tsx" ]; then
  sed -i '' 's/OGas Marketplace/OGas/g' "./app/layout.tsx"
  echo "✓ layout.tsx metadata updated"
fi

# Update manifest.json if exists
if [ -f "./public/manifest.json" ]; then
  sed -i '' 's/OGas Marketplace/OGas/g' "./public/manifest.json"
  echo "✓ manifest.json updated"
fi

echo ""
echo "=== Done! Verifying changes ==="
echo ""
echo "Files with 'OGas' (should be buyer pages):"
grep -r "OGas" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "OGas Marketplace" | head -10

echo ""
echo "Files with 'OGas Marketplace' (should be seller pages):"
grep -r "OGas Marketplace" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next" | head -10

