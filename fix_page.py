with open("app/page.tsx", "r") as f:
    lines = f.readlines()

# Fix 1: add Calculator to import
lines[0] = lines[0].replace(
    "import { ChevronRight, MapPin, ShieldCheck, Store, Users } from 'lucide-react';",
    "import { ChevronRight, MapPin, ShieldCheck, Store, Users, Calculator } from 'lucide-react';"
)

# Fix 2: find and fix the two broken color references anywhere in the file
for i, line in enumerate(lines):
    if "color={TEAL}" in line:
        lines[i] = line.replace("color={TEAL}", "color=\"#12a5b0\"")
    if "color: {NAVY}" in line:
        lines[i] = line.replace("color: {NAVY}", "color: \"#16305e\"")

with open("app/page.tsx", "w") as f:
    f.writelines(lines)

print("Fixed both issues.")
