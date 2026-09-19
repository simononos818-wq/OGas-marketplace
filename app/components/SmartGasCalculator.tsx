"use client";

import { useEffect, useMemo, useState } from "react";
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

type Mode = "buyer" | "seller";

export default function SmartGasCalculator({
  defaultMode = "buyer",
  shopName = "OGas",
  shopArea = "Gas calculator",
  lockedPrice,
  refillHref,
}: {
  defaultMode?: Mode;
  shopName?: string;
  shopArea?: string;
  lockedPrice?: number;
  refillHref?: string;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [pricePerKg, setPricePerKg] = useState(lockedPrice || DEFAULT_PRICE_PER_KG);
  const [buyMode, setBuyMode] = useState<"money" | "bottle">("money");
  const [money, setMoney] = useState("3000");
  const [size, setSize] = useState(12);
  const [sales, setSales] = useState<SaleRow[]>([]);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (lockedPrice && lockedPrice > 0) setPricePerKg(lockedPrice);
  }, [lockedPrice]);

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

  const addSale = () => {
    if (fillKg < SCALE_STEP) return;
    const row: SaleRow = {
      id: String(Date.now()),
      at: Date.now(),
      kg: fillKg,
      gasCost,
      cash: buyMode === "money" ? cash : gasCost,
      change,
      kind: buyMode,
    };
    const next = [row, ...sales];
    setSales(next);
    saveTodaySales(next);
  };

  const clearSales = () => {
    setSales([]);
    saveTodaySales([]);
  };

  return (
    <div className="min-h-dvh bg-black text-white pb-28" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
      <header className="px-4 pb-3 flex items-center gap-3">
        <img src="/ogas-icon.svg" alt="OGas" className="w-10 h-10 rounded-full bg-white object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-gray-500 leading-none">OGas</p>
          <h1 className="font-bold truncate">{mode === "buyer" ? shopName : "Sales calculator"}</h1>
          <p className="text-xs text-gray-500 truncate">{mode === "buyer" ? shopArea : "Payment → kg + change"}</p>
        </div>
      </header>

      <div className="px-4 mb-4 flex bg-gray-900 rounded-2xl p-1">
        <button
          type="button"
          onClick={() => setMode("buyer")}
          className={`flex-1 py-3 rounded-xl text-sm font-bold ${mode === "buyer" ? "bg-orange-500 text-black" : "text-gray-400"}`}
        >
          Refill
        </button>
        <button
          type="button"
          onClick={() => setMode("seller")}
          className={`flex-1 py-3 rounded-xl text-sm font-bold ${mode === "seller" ? "bg-orange-500 text-black" : "text-gray-400"}`}
        >
          Sales
        </button>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-sm text-gray-400">{mode === "buyer" ? "Today" : "Your price today"}</p>
          {mode === "seller" || !lockedPrice ? (
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold">₦</span>
              <input
                inputMode="numeric"
                value={pricePerKg || ""}
                onChange={(e) => setPricePerKg(Number(String(e.target.value).replace(/[^0-9]/g, "")) || 0)}
                className="flex-1 bg-transparent text-3xl font-bold outline-none"
              />
              <span className="text-gray-400 pb-1">= 1kg</span>
            </div>
          ) : (
            <p className="text-3xl font-bold">{naira(pricePerKg)} = 1kg</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Scale: 0.05 · 0.10 · 0.15 … 1.00 · 1.05</p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            {BOTTLE_SIZES.map((sz) => (
              <div key={sz} className="bg-gray-800 rounded-xl px-3 py-2">
                {sz}kg = {naira(Math.round(pricePerKg * sz))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="font-bold mb-3">{mode === "buyer" ? "How would you like to buy?" : "Customer payment"}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setBuyMode("money")}
              className={`p-3 rounded-xl border-2 text-left ${buyMode === "money" ? "border-orange-500 bg-orange-500/10" : "border-gray-700 bg-gray-800"}`}
            >
              <div className="font-bold">{mode === "buyer" ? "By amount" : "By amount"}</div>
              
            </button>
            <button
              type="button"
              onClick={() => setBuyMode("bottle")}
              className={`p-3 rounded-xl border-2 text-left ${buyMode === "bottle" ? "border-orange-500 bg-orange-500/10" : "border-gray-700 bg-gray-800"}`}
            >
              <div className="font-bold">{mode === "buyer" ? "By cylinder size" : "By cylinder size"}</div>
              
            </button>
          </div>

          {buyMode === "money" ? (
            <>
              <label className="text-sm text-gray-400">{mode === "buyer" ? "Amount" : "Amount received"}</label>
              <input
                inputMode="numeric"
                value={money}
                onChange={(e) => setMoney(e.target.value)}
                placeholder="3000"
                className="w-full mt-1 bg-gray-800 rounded-xl px-4 py-4 text-2xl font-bold text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {BOTTLE_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSize(sz)}
                  className={`p-3 rounded-xl border-2 ${size === sz ? "border-orange-500 bg-orange-500/10" : "border-gray-700 bg-gray-800"}`}
                >
                  <div className="font-bold">{sz}kg</div>
                  <div className="text-xs text-gray-400">{naira(Math.round(pricePerKg * sz))}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-orange-500 text-black rounded-2xl p-4">
          {fillKg >= SCALE_STEP ? (
            <>
              
              <p className="text-4xl font-black leading-tight">{fillKg.toFixed(2)} kg</p>
              <p className="mt-1 font-semibold">
                {naira(gasCost)}
                {change > 0 ? ` · change ${naira(change)}` : ""}
              </p>
            </>
          ) : (
            <p className="font-semibold">
              {cash > 0
                ? `Minimum fill is 0.05kg — ${naira(Math.round(pricePerKg * SCALE_STEP))}`
                : "Enter an amount or choose a size."}
            </p>
          )}
        </div>

        {mode === "buyer" ? (
          <div className="space-y-2">
            {refillHref ? (
              <Link href={refillHref} className="block text-center bg-white text-black font-bold py-4 rounded-2xl">
                Order refill
              </Link>
            ) : (
              <p className="text-center text-sm text-gray-500">Show this screen to the shop.</p>
            )}
            <Link href="/shops" className="block text-center text-sm text-gray-500 py-2">
              Browse all sellers
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={addSale}
              disabled={fillKg < SCALE_STEP}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl disabled:bg-gray-800 disabled:text-gray-500"
            >
              Add sale
            </button>
            <div className="bg-gray-900 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold">Today's sales</p>
                {sales.length > 0 && (
                  <button type="button" onClick={clearSales} className="text-xs text-gray-500">
                    Clear today
                  </button>
                )}
              </div>
              <p className="text-lg font-bold text-orange-400">
                {totals.count} refill · {totals.kg.toFixed(2)} kg · {naira(totals.naira)}
              </p>
              <div className="mt-3 space-y-2 max-h-48 overflow-auto">
                {sales.length === 0 && <p className="text-sm text-gray-500">No sales yet.</p>}
                {sales.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm bg-gray-800 rounded-xl px-3 py-2">
                    <span>{s.kg.toFixed(2)} kg</span>
                    <span>{naira(s.gasCost)}{s.change ? ` · change ${naira(s.change)}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
