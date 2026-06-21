'use client';

import { useState } from 'react';
import { Calculator, Flame, Users, ChefHat, Clock, Droplets } from 'lucide-react';

export default function GasCalculatorPage() {
  const [familySize, setFamilySize] = useState(4);
  const [cookingFrequency, setCookingFrequency] = useState('daily');
  const [stoveType, setStoveType] = useState('gas');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    let baseKg = familySize * 2.5;
    const freqMultiplier: Record<string, number> = { daily: 1, twice: 0.6, weekend: 0.3, occasional: 0.15 };
    baseKg *= freqMultiplier[cookingFrequency] || 1;
    const stoveMultiplier: Record<string, number> = { gas: 1, electric: 0, dual: 0.7, kerosene: 1.2 };
    baseKg *= stoveMultiplier[stoveType] || 1;
    
    const monthlyKg = Math.round(baseKg * 10) / 10;
    const cylinderSize = monthlyKg <= 3 ? '3kg' : monthlyKg <= 5 ? '5kg' : monthlyKg <= 6 ? '6kg' : monthlyKg <= 12.5 ? '12.5kg' : monthlyKg <= 25 ? '25kg' : '50kg';
    const refillFrequency = Math.max(1, Math.round(30 / (monthlyKg / parseFloat(cylinderSize.replace('kg', '')))));
    
    setResult({
      monthlyKg,
      cylinderSize,
      refillFrequency,
      estimatedCost: Math.round(monthlyKg * 1200),
      savings: Math.round(monthlyKg * 1200 * 0.15)
    });
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Calculator size={24} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Smart Calculator</h1>
            <p className="text-gray-400 text-sm">Find your perfect gas plan</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-orange-500" />
              <h3 className="font-bold">Family Size</h3>
            </div>
            <div className="flex items-center justify-between">
              {[1,2,3,4,5,6,7,8].map(n => (
                <button
                  key={n}
                  onClick={() => setFamilySize(n)}
                  className={`w-10 h-10 rounded-xl font-bold transition ${
                    familySize === n ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-center text-gray-400 mt-2 text-sm">{familySize} {familySize === 1 ? 'person' : 'people'}</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-orange-500" />
              <h3 className="font-bold">How often do you cook?</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'daily', label: 'Every day' },
                { value: 'twice', label: 'Twice a week' },
                { value: 'weekend', label: 'Weekends only' },
                { value: 'occasional', label: 'Occasionally' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCookingFrequency(opt.value)}
                  className={`p-3 rounded-xl text-sm font-medium transition ${
                    cookingFrequency === opt.value ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ChefHat size={18} className="text-orange-500" />
              <h3 className="font-bold">Stove Type</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'gas', label: 'Gas Only' },
                { value: 'dual', label: 'Gas + Electric' },
                { value: 'kerosene', label: 'Kerosene + Gas' },
                { value: 'electric', label: 'Electric Only' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStoveType(opt.value)}
                  className={`p-3 rounded-xl text-sm font-medium transition ${
                    stoveType === opt.value ? 'bg-orange-500 text-black' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-orange-500 text-black font-bold py-4 rounded-2xl hover:bg-orange-400 transition text-lg"
          >
            Calculate My Gas Needs
          </button>

          {result && (
            <div className="bg-gradient-to-b from-orange-900/30 to-gray-900 border border-orange-500/30 rounded-2xl p-6 space-y-4">
              <div className="text-center">
                <Flame size={32} className="text-orange-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-orange-400">Your Recommendation</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-500">{result.cylinderSize}</p>
                  <p className="text-xs text-gray-400">Recommended Size</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-500">{result.monthlyKg}kg</p>
                  <p className="text-xs text-gray-400">Monthly Usage</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-500">N{result.estimatedCost.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Est. Monthly Cost</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-500">Every {result.refillFrequency} days</p>
                  <p className="text-xs text-gray-400">Refill Frequency</p>
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-2">
                <Droplets size={16} className="text-green-500" />
                <p className="text-sm text-green-400">Save N{result.savings.toLocaleString()}/month by buying bulk!</p>
              </div>

              <button
                onClick={() => window.location.href = '/buy'}
                className="w-full bg-orange-500 text-black font-bold py-3 rounded-xl hover:bg-orange-400 transition"
              >
                Find Sellers Near Me
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
