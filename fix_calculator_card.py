with open("app/page.tsx", "r") as f:
    lines = f.readlines()

cleaned = []
skip_until_close = 0
for line in lines:
    if "{/* CALCULATE */}" in line:
        skip_until_close = 1
        continue
    if skip_until_close > 0:
        if "</Link>" in line and skip_until_close == 1:
            skip_until_close = 2
            continue
        if "</Link>" in line and skip_until_close == 2:
            skip_until_close = 0
            continue
        continue
    cleaned.append(line)

insert_idx = None
for i, line in enumerate(cleaned):
    if "BUY GAS" in line:
        for j in range(i+1, min(i+10, len(cleaned))):
            if "</Link>" in cleaned[j]:
                insert_idx = j + 1
                break
        break

card = """                {/* CALCULATE */}
                <Link href="/calculator"
                  className="w-full flex items-center gap-3 rounded-2xl p-3.5 mb-3 bg-white"
                  style={{ boxShadow: '0 2px 8px rgba(20,30,50,.06)' }}>
                  <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#e6f7f8' }}>
                    <Calculator size={22} color="#12a5b0" />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block font-black text-[16px] tracking-wide" style={{ color: "#16305e" }}>CALCULATE</span>
                    <span className="block text-[10px] mt-0.5" style={{ color: '#8a8f98' }}>Cost - kg to litres - profit</span>
                  </span>
                  <ChevronRight size={18} color="#9aa0a8" />
                </Link>

"""

if insert_idx:
    cleaned.insert(insert_idx, card)

with open("app/page.tsx", "w") as f:
    f.writelines(cleaned)

print("Done.")
