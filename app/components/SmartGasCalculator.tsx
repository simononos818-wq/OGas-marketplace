"use client";

import { useState, useMemo, useEffect } from "react";
import {
  moneyToKg,
  kgToMoney,
  getCylinderCosts,
  estimateUsage,
  generateWhatsAppMessage,
  COMMON_CYLINDERS,
} from "@/lib/gasCalculator";

export default function SmartGasCalculator() {
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const [pricePerKg, setPricePerKg] = useState(1400);
  const [amount, setAmount] = useState("");
  const [kg, setKg] = useState("");
  const [familySize, setFamilySize] = useState(4);
  const [cookingHours, setCookingHours] = useState(1.5);
  const [cylinderSize, setCylinderSize] = useState(12.5);

  // Remaining Gas Tracker
  const [currentWeight, setCurrentWeight] = useState("");
  const [fullCylinderSize, setFullCylinderSize] = useState(12.5);

  // Remember last used price
  useEffect(() => {
    const saved = localStorage.getItem("ogas_last_price");
    if (saved) setPricePerKg(Number(saved));
  }, []);

  useEffect(() => {
    if (pricePerKg > 0) {
      localStorage.setItem("ogas_last_price", String(pricePerKg));
    }
  }, [pricePerKg]);

  const moneyResult = useMemo(() => {
    const val = parseFloat(amount);
    if (!val) return null;
    return moneyToKg(val, pricePerKg);
  }, [amount, pricePerKg]);

  const kgResult = useMemo(() => {
    const val = parseFloat(kg);
    if (!val) return null;
    return kgToMoney(val, pricePerKg);
  }, [kg, pricePerKg]);

  const cylinderCosts = useMemo(() => getCylinderCosts(pricePerKg), 
[pricePerKg]);

  const usage = useMemo(
    () =>
      estimateUsage({
        familySize,
        cookingHoursPerDay: cookingHours,
        cylinderSize,
        pricePerKg,
      }),
    [familySize, cookingHours, cylinderSize, pricePerKg]
  );

  const remaining = useMemo(() => {
    const current = parseFloat(currentWeight);
    if (!current || current <= 0) return null;

    const daily = usage.dailyKg;
    const daysLeft = current / daily;

    return {
      kgLeft: current,
      daysLeft: Math.max(0, Math.round(daysLeft)),
      percentage: Math.min(100, Math.round((current / fullCylinderSize) * 
100)),
      status: daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "low" : "good",
    };
  }, [currentWeight, usage.dailyKg, fullCylinderSize]);

  const shareMessage = () => {
    if (moneyResult) {
      const msg = generateWhatsAppMessage({
        kg: moneyResult.kg,
        amount: parseFloat(amount),
        pricePerKg,
      });
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, 
"_blank");
    }
  };

  const handleOrderThis = (quantity: number) => {
    window.location.href = `/order?kg=${quantity}&price=${pricePerKg}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Smart Gas 
Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Accurate • Fast • Built for Nigerian buyers & sellers
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setMode("buyer")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium 
transition ${
            mode === "buyer" ? "bg-white shadow text-green-700" : 
"text-gray-600"
          }`}
        >
          Buyer Mode
        </button>
        <button
          onClick={() => setMode("seller")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium 
transition ${
            mode === "seller" ? "bg-white shadow text-green-700" : 
"text-gray-600"
          }`}
        >
          Seller Mode
        </button>
      </div>

      {/* Price Input */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Price per kg (₦)
        </label>
        <input
          type="number"
          value={pricePerKg}
          onChange={(e) => setPricePerKg(Number(e.target.value) || 0)}
          className="w-full text-2xl font-bold border rounded-xl px-4 py-3 
focus:ring-2 focus:ring-green-500 outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">Price is remembered for 
next time</p>
      </div>

      {/* Money → Kg */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm 
space-y-3">
        <h3 className="font-semibold text-gray-800">I have this 
amount</h3>
        <input
          type="number"
          placeholder="e.g. 8000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-lg 
outline-none focus:ring-2 focus:ring-green-500"
        />
        {moneyResult && (
          <div className="bg-green-50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm text-green-700">Seller should fill</p>
              <p className="text-3xl font-bold 
text-green-800">{moneyResult.formatted}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={shareMessage}
                className="flex-1 bg-green-600 text-white py-2.5 
rounded-xl font-medium text-sm"
              >
                Share on WhatsApp
              </button>
              <button
                onClick={() => handleOrderThis(moneyResult.kg)}
                className="flex-1 bg-black text-white py-2.5 rounded-xl 
font-medium text-sm"
              >
                Order this
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Kg → Money */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm 
space-y-3">
        <h3 className="font-semibold text-gray-800">I want this 
quantity</h3>
        <input
          type="number"
          placeholder="e.g. 11"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-lg 
outline-none focus:ring-2 focus:ring-green-500"
        />
        {kgResult && (
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-sm text-blue-700">You will pay</p>
              <p className="text-3xl font-bold 
text-blue-800">{kgResult.formatted}</p>
            </div>
            <button
              onClick={() => handleOrderThis(parseFloat(kg))}
              className="w-full bg-black text-white py-2.5 rounded-xl 
font-medium text-sm"
            >
              Order {kg} kg now
            </button>
          </div>
        )}
      </div>

      {/* Remaining Gas Tracker */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm 
space-y-4">
        <h3 className="font-semibold text-gray-800">Remaining Gas 
Tracker</h3>
        <p className="text-xs text-gray-500">
          Enter the current weight of your cylinder to know how many days 
you have left
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Current Weight 
(kg)</label>
            <input
              type="number"
              placeholder="e.g. 4.2"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Full Size</label>
            <select
              value={fullCylinderSize}
              onChange={(e) => 
setFullCylinderSize(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            >
              {COMMON_CYLINDERS.map((size) => (
                <option key={size} value={size}>
                  {size} kg
                </option>
              ))}
            </select>
          </div>
        </div>

        {remaining && (
          <div
            className={`rounded-xl p-4 ${
              remaining.status === "critical"
                ? "bg-red-50"
                : remaining.status === "low"
                ? "bg-orange-50"
                : "bg-green-50"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Gas Left</span>
              <span className="text-xl font-bold">{remaining.kgLeft} 
kg</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  remaining.status === "critical"
                    ? "bg-red-500"
                    : remaining.status === "low"
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${remaining.percentage}%` }}
              />
            </div>
            <p className="text-sm">
              Approximately <strong>{remaining.daysLeft} days</strong> 
remaining
            </p>
            {remaining.status === "critical" && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                ⚠️ Running very low — refill soon
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Cylinder Prices */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Quick Cylinder 
Prices</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cylinderCosts.map((item) => (
            <button
              key={item.size}
              onClick={() => handleOrderThis(item.size)}
              className="border rounded-xl p-3 text-center 
hover:border-green-500 hover:bg-green-50 transition"
            >
              <p className="text-sm text-gray-500">{item.size} kg</p>
              <p className="font-bold text-lg">{item.formatted}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Usage Estimator */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm 
space-y-4">
        <h3 className="font-semibold text-gray-800">Family Usage 
Estimator</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Family Size</label>
            <input
              type="number"
              value={familySize}
              onChange={(e) => setFamilySize(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Cooking 
hrs/day</label>
            <input
              type="number"
              step="0.5"
              value={cookingHours}
              onChange={(e) => setCookingHours(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">Cylinder Size</label>
          <select
            value={cylinderSize}
            onChange={(e) => setCylinderSize(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
          >
            {COMMON_CYLINDERS.map((size) => (
              <option key={size} value={size}>
                {size} kg
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Daily use</span>
            <span className="font-medium">{usage.formatted.daily}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Lasts</span>
            <span className="font-medium">{usage.formatted.days}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Monthly cost</span>
            <span className="font-bold 
text-green-700">{usage.formatted.monthly}</span>
          </div>
          <p className="text-xs text-gray-500 pt-2 
border-t">{usage.advice}</p>
        </div>
      </div>
    </div>
  );
}
