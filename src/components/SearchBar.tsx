"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterClick?: () => void;
  className?: string;
}

export function SearchBar({ onSearch, onFilterClick, className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative", className)}
    >
      <div
        className={cn(
          "relative flex items-center gap-2 bg-dark-card border rounded-2xl transition-all duration-300",
          isFocused
            ? "border-brand-500/50 ring-2 ring-brand-500/20"
            : "border-dark-border hover:border-dark-text/30"
        )}
      >
        <div className="flex items-center flex-1 pl-4">
          <Search className={cn("w-5 h-5 transition-colors", isFocused ? "text-brand-500" : "text-dark-text")} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search vendors, locations..."
            className="w-full bg-transparent border-none px-3 py-3.5 text-white placeholder-dark-text focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onSearch("");
              }}
              className="p-1 rounded-full hover:bg-dark-lighter text-dark-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 pr-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-lighter text-sm text-dark-text hover:text-white transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Nearby</span>
          </button>
          
          <button
            type="button"
            onClick={onFilterClick}
            className="p-2.5 rounded-xl bg-dark-lighter text-dark-text hover:text-white hover:bg-dark-border transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-flame to-brand-500 text-white font-medium hover:shadow-lg hover:shadow-brand-500/25 transition-all"
          >
            Search
          </button>
        </div>
      </div>
    </motion.form>
  );
}
