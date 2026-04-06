"use client";

import { motion } from "framer-motion";
import { Home, UtensilsCrossed, Factory, Car, Building2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const categories: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: Building2 },
  { id: "household", label: "Household", icon: Home },
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { id: "industrial", label: "Industrial", icon: Factory },
  { id: "autogas", label: "Autogas", icon: Car },
  { id: "commercial", label: "Commercial", icon: Building2 },
  { id: "refills", label: "Refills", icon: RotateCcw },
];

interface CategoryFilterProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-3 px-4 py-2 min-w-max">
        {categories.map((category) => {
          const isSelected = selected === category.id;
          const Icon = category.icon;
          
          return (
            <motion.button
              key={category.id}
              onClick={() => onSelect(category.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
                isSelected
                  ? "bg-gradient-to-r from-flame to-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "bg-dark-card border border-dark-border text-dark-text hover:border-brand-500/30 hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4", isSelected && "text-white")} />
              <span>{category.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
