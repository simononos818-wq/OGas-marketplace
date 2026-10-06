"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  BOTTLE_SIZES,
  DEFAULT_PRICE_PER_KG,
  SCALE_STEP,
  loadTodaySales,
  moneyToKg,
  naira,
  saveTodaySales,
  saleTotals,
  type SaleRow,
} from "@/lib/gasCalculator";
import { Flame, ArrowRightLeft, CalendarDays, TrendingUp, ShoppingCart } from "lucide-react";

const NAVY = "#16305e";
const TEAL = "#12a5b0";
const LITRES_PER_KG = 1.96;

type Mode = "buyer" | "seller";
type Tab = "calc" | "convert";

const HOUSEHOLD_RATES = [
  { label: "1-2 people", kgPerDay: 0.25 },
  { label: "3-4 people", kgPerDay: 0.45 },
  { label: "5+ people", kgPerDay: 0.7 },
];

function ConverterPanel({ pricePerKg }: { pricePerKg: number }) {
  const [dir, setDir] = useState<"kg2l" | "l2kg">("kg2l");
  const [val, setVal] = useState("12.5");

  const num = Number(String(val).replace(/[^0-9.]/g, "")) || 0;
  const kg = dir === "kg2l" ? num : num / LITRES_PER_KG;
  const litres = dir === "kg2l" ? num * LITRES_PER_KG : num;
  const cost = Math.round(kg * pricePerKg);

  return (
    <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(20,30,50,.06)" }}>
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft size={16} color={TEAL} />
        <p className="font-extrabold text-[14px]" style={{ color: NAVY }}>KG - LITRES CONVERTER</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {([["kg2l", "kg to litres"], ["l2kg", "litres to kg"]] as const).map(([d, label]) => (
          <button key={d} type="button" onClick={() => setDir(d)}
            className="py-2.5 rounded-xl text-[12px] font-bold"
            style={dir === d ? { background: NAVY, color: "#fff" } : { background: "#f0f2f5", color: "#5b616b" }}>
            {label}
          </button>
        ))}
      </div>
      <label className="text-[11px] font-semibold" style={{ color: "#8a8f98" }}>
        {dir === "kg2l" ? "Kilograms (kg)" : "Litres (L)"}
      </label>
      <input inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)}
        className="w-full mt-1 rounded-xl px-4 py-3.5 text-2xl font-black outline-none"
        style={{ background: "#f4f6f8", color: NAVY, border: "1.5px solid #e6e9ee" }} />
      <div className="mt-3 rounded-xl p-3.5" style={{ background: "#e6f7f8" }}>
        <p className="text-[11px] font-semibold" style={{ color: "#4a7a80" }}>
          {dir === "kg2l" ? "In litres" : "In kilograms"}
        </p>
        <p className="text-2xl font-black" style={{ color: TEAL }}>
          {dir === "kg2l" ? `${litres.toFixed(2)} L` : `${kg.toFixed(2)} kg`}
        </p>
        <p className="text-[13px] font-bold mt-0.5" style={{ color: NAVY }}>{naira(cost)} at {naira(pricePerKg)}/kg</p>
      </div>
      <p className="text-[9px] mt-2" style={{ color: "#9aa0a8" }}>1 kg LPG is about 1.96 litres (standard density)</p>
    </div>
  );
}

function LastingPanel() {
  const [kg, setKg] = useState("12.5");
  const [hh, setHh] = useState(1);
  const num = Number(String(kg).replace(/[^0-9.]/g, "")) || 0;
  const days = num / HOUSEHOLD_RATES[hh].kgPerDay;
  const runOut = new Date(Date.now() + days * 86400000);

  return (
    <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(20,30,50,.06)" }}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={16} color={TEAL} />
        <p className="font-extrabold text-[14px]" style={{ color: NAVY }}>HOW LONG WILL IT LAST?</p>
      </div>
      <label className="text-[11px] font-semibold" style={{ color: "#8a8f98" }}>Gas you have (kg)</label>
      <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)}
        className="w-full mt-1 rounded-xl px-4 py-3.5 text-2xl font-black outline-none"
        style={{ background: "#f4f6f8", color: NAVY, border: "1.5px solid #e6e9ee" }} />
      <div className="grid grid-cols-3 gap-2 mt-3">
        {HOUSEHOLD_RATES.map((h, i) => (
          <button key={h.label} type="button" onClick={() => setHh(i)}
            className="py-2 rounded-xl text-[11px] font-bold"
            style={hh === i ? { background: NAVY, color: "#fff" } : { background: "#f0f2f5", color: "#5b616b" }}>
            {h.label}
          </button>
        ))}
      </div>
      {num > 0 && (
        <div className="mt-3 rounded-xl p-3.5" style={{ background: "#e6f7f8" }}>
          <p className="text-2xl font-black" style={{ color: TEAL }}>~{Math.round(days)} days</p>
          <p className="text-[12px] font-bold" style={{ color: NAVY }}>
            Runs out around {runOut.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SmartGasCalculator({
  defaultMode = "buyer",
  shopName = "OGas",
  lockedPrice,
  refillHref,
}: {
  defaultMode?: Mode;
  shopName?: string;
  lockedPrice?: number;
  refillHref?: string;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [tab, setTab] = useState<Tab>("calc");
  const [pricePerKg, setPricePerKg] = useState(lockedPrice || DEFAULT_PRICE_PER_KG);
  const [buyMode, setBuyMode] = useState<"money" | "bottle">("money");
  const [money, setMoney] = useState("3000");
  const [size, setSize] = useState(12);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [costPrice, setCostPrice] = useState("");

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);
  useEffect(() => { if (lockedPrice && lockedPrice > 0) setPricePerKg(lockedPrice); }, [lockedPrice]);
  useEffect(() => {
    if (!lockedPrice) {
      const saved = localStorage.getItem("ogas_last_price");
      if (saved) setPricePerKg(Number(saved) || DEFAULT_PRICE_PER_KG);
    }
    setSales(loadTodaySales());
  }, [lockedPrice]);
  useEffect(() => {
    if (pricePerKg > 0) localStorage.setItem("ogas_last_price", String(pricePerKg));
  }, [pricePerKg]);

  const cash = Number(String(money).replace(/[^0-9.]/g, "")) || 0;
  const moneyFill = moneyToKg(cash, pricePerKg);
  const fillKg = buyMode === "money" ? moneyFill.kg : size;
  const gasCost = buyMode === "money" ? moneyFill.gasCost : Math.round(pricePerKg * size);
  const change = buyMode === "money" ? moneyFill.change : 0;
  const totals = useMemo(() => saleTotals(sales), [sales]);

  const cost = Number(String(costPrice).replace(/[^0-9.]/g, "")) || 0;
  const margin = pricePerKg - cost;
  const profit47 = margin * 47;
  const profitToday = margin * totals.kg;

  const addSale = () => {
    if (fillKg < SCALE_STEP) return;
    const row: SaleRow = {
      id: String(Date.now()), at: Date.now(), kg: fillKg, gasCost,
      cash: buyMode === "money" ? cash : gasCost, change, kind: buyMode,
    };
    const next = [row, ...sales];
    setSales(next);
    saveTodaySales(next);
  };

  const inp: CSSProperties = { background: "#f4f6f8", color: NAVY, border: "1.5px solid #e6e9ee" };

  return (
    <div className="min-h-dvh pb-28" style={{ background: "#f4f6f8", maxWidth: 480, margin: "0 auto" }}>
      <header className="px-4 pt-3 pb-3 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${NAVY}, #1e4078)` }}>
        <img src="/ogas-icon.svg" alt="OGas" className="w-10 h-10 rounded-full bg-white object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-widest" style={{ color: "#8fa6c9" }}>OGAS SMART CALCULATOR</p>
          <h1 className="font-extrabold text-white text-[16px] truncate">
            {mode === "buyer" ? (shopName || "Refill cost") : "Sales and profit"}
          </h1>
        </div>
      </header>

      <div className="px-3 pt-3">
        <div className="flex bg-white rounded-2xl p-1" style={{ boxShadow: "0 1px 3px rgba(20,30,50,.06)" }}>
          {([["buyer", "I WANT TO BUY", ShoppingCart], ["seller", "I WANT TO SELL", TrendingUp]] as const).map(([m, label, Icon]) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className="flex-1 py-3 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1.5"
              style={mode === m ? { background: NAVY, color: "#fff" } : { color: "#8a8f98" }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-2.5">
        <div className="flex gap-1.5">
          {([["calc", "Calculator"], ["convert", "Converter"]] as const).map(([t, label]) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className="text-[11px] font-bold px-4 py-2 rounded-[13px]"
              style={tab === t ? { background: TEAL, color: "#fff" } : { background: "#fff", color: "#5b616b", border: "1px solid #e6e9ee" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-3 pt-3 space-y-3">
        {tab === "convert" ? (
          <>
            <ConverterPanel pricePerKg={pricePerKg} />
            {mode === "buyer" && <LastingPanel />}
          </>
        ) : (
          <>
            <div className="rounded-2xl p-4 bg-white" style={{ boxShadow: "0 2px 8px rgba(20,30,50,.06)" }}>
              <p className="text-[11px] font-semibold" style={{ color: "#8a8f98" }}>
                {mode === "seller" ? "Your selling price today" : "Price today"}
              </p>
              {mode === "seller" || !lockedPrice ? (
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-black" style={{ color: TEAL }}>N</span>
                  <input inputMode="numeric" value={pricePerKg || ""}
                    onChange={(e) => setPricePerKg(Number(String(e.target.value).replace(/[^0-9]/g, "")) || 0)}
                    className="flex-1 bg-transparent text-3xl font-black outline-none" style={{ color: NAVY }} />
                  <span className="pb-1 text-[12px]" style={{ color: "#8a8f98" }}>= 1kg</span>
                </div>
              ) : (
                <p className="text-3xl font-black mt-1" style={{ color: NAVY }}>{naira(pricePerKg)} <span className="text-[12px] font-semibold" style={{ color: "#8a8f98" }}>= 1kg</span></p>
              )}
              <div className="grid grid-cols-2 gap-2 mt-3 text-[12px] font-bold" style={{ color: NAVY }}>
                {BOTTLE_SIZES.map((sz) => (
                  <div key={sz} className="rounded-xl px-3 py-2" style={{ background: "#f4f6f8" }}>
                    {sz}kg = {naira(Math.round(pricePerKg * sz))}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white" style={{ boxShadow: "0 2px 8px rgba(20,30,50,.06)" }}>
              <p className="font-extrabold text-[14px] mb-3" style={{ color: NAVY }}>
                {mode === "buyer" ? "How would you like to buy?" : "Customer payment"}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([["money", "By amount"], ["bottle", "By cylinder size"]] as const).map(([b, label]) => (
                  <button key={b} type="button" onClick={() => setBuyMode(b)}
                    className="py-3 rounded-xl text-[12px] font-bold"
                    style={buyMode === b ? { background: NAVY, color: "#fff" } : { background: "#f0f2f5", color: "#5b616b" }}>
                    {label}
                  </button>
                ))}
              </div>
              {buyMode === "money" ? (
                <>
                  <label className="text-[11px] font-semibold" style={{ color: "#8a8f98" }}>
                    {mode === "buyer" ? "Amount" : "Amount received"}
                  </label>
                  <input inputMode="numeric" value={money} onChange={(e) => setMoney(e.target.value)} placeholder="3000"
                    className="w-full mt-1 rounded-xl px-4 py-3.5 text-2xl font-black outline-none" style={inp} />
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {BOTTLE_SIZES.map((sz) => (
                    <button key={sz} type="button" onClick={() => setSize(sz)}
                      className="py-3 rounded-xl"
                      style={size === sz ? { background: "#e6f7f8", border: `1.5px solid ${TEAL}` } : { background: "#f0f2f5", border: "1.5px solid transparent" }}>
                      <div className="font-extrabold text-[14px]" style={{ color: NAVY }}>{sz}kg</div>
                      <div className="text-[11px] font-semibold" style={{ color: "#8a8f98" }}>{naira(Math.round(pricePerKg * sz))}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${TEAL}, #0d8a94)`, boxShadow: "0 6px 16px rgba(18,165,176,.3)" }}>
              {fillKg >= SCALE_STEP ? (
                <>
                  <p className="text-4xl font-black leading-tight">{fillKg.toFixed(2)} kg</p>
                  <p className="mt-1 font-bold">
                    {naira(gasCost)}{change > 0 ? ` - change ${naira(change)}` : ""}
                  </p>
                </>
              ) : (
                <p className="font-bold">
                  {cash > 0 ? `Minimum fill is 0.05kg - ${naira(Math.round(pricePerKg * SCALE_STEP))}` : "Enter an amount or choose a size."}
                </p>
              )}
            </div>

            {mode === "buyer" ? (
              <div className="space-y-2">
                <Link href={refillHref || "/shops"}
                  className="w-full flex items-center justify-center gap-2 text-white font-extrabold text-[14px] py-4 rounded-2xl"
                  style={{ background: NAVY, boxShadow: "0 4px 12px rgba(22,48,94,.3)" }}>
                  <Flame size={15} color="#2dd4c2" /> Order this refill
                </Link>
                <p className="text-center text-[10px]" style={{ color: "#8a8f98" }}>Show this screen to the shop.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <button type="button" onClick={addSale} disabled={fillKg < SCALE_STEP}
                  className="w-full font-extrabold text-[14px] py-4 rounded-2xl text-white disabled:opacity-40"
                  style={{ background: NAVY }}>
                  Add sale
                </button>

                <div className="rounded-2xl p-4 bg-white" style={{ boxShadow: "0 2px 8px rgba(20,30,50,.06)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} color={TEAL} />
                    <p className="font-extrabold text-[14px]" style={{ color: NAVY }}>MY PROFIT</p>
                  </div>
                  <label className="text-[11px] font-semibold" style={{ color: "#8a8f98" }}>What I pay per kg (plant price)</label>
                  <input inputMode="numeric" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="1100"
                    className="w-full mt-1 rounded-xl px-4 py-3 text-xl font-black outline-none" style={inp} />
                  {cost > 0 && margin !== 0 && (
                    <div className="mt-3 space-y-1.5 text-[13px] font-bold" style={{ color: NAVY }}>
                      <p>Margin: <span style={{ color: margin > 0 ? "#0fa958" : "#e74c3c" }}>{naira(margin)}/kg</span></p>
                      <p>Profit per 47kg cylinder: <span style={{ color: margin > 0 ? "#0fa958" : "#e74c3c" }}>{naira(Math.round(profit47))}</span></p>
                      <p>Profit on today&apos;s {totals.kg.toFixed(2)}kg: <span style={{ color: margin > 0 ? "#0fa958" : "#e74c3c" }}>{naira(Math.round(profitToday))}</span></p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl p-4 bg-white" style={{ boxShadow: "0 2px 8px rgba(20,30,50,.06)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-extrabold text-[14px]" style={{ color: NAVY }}>Today&apos;s sales</p>
                    {sales.length > 0 && (
                      <button type="button" onClick={() => { setSales([]); saveTodaySales([]); }} className="text-[11px] font-bold" style={{ color: "#e74c3c" }}>
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-[15px] font-black" style={{ color: TEAL }}>
                    {totals.count} refill - {totals.kg.toFixed(2)} kg - {naira(totals.naira)}
                  </p>
                  <div className="mt-3 space-y-2 max-h-48 overflow-auto">
                    {sales.length === 0 && <p className="text-[12px]" style={{ color: "#8a8f98" }}>No sales yet.</p>}
                    {sales.map((s) => (
                      <div key={s.id} className="flex justify-between text-[12px] font-bold rounded-xl px-3 py-2" style={{ background: "#f4f6f8", color: NAVY }}>
                        <span>{s.kg.toFixed(2)} kg</span>
                        <span>{naira(s.gasCost)}{s.change ? ` - change ${naira(s.change)}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
