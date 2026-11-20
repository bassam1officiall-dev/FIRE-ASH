import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import type { CravingType } from '../types/menu';
import { CRAVING_FILTERS } from '../data/menuData';

interface DecisionBarProps {
  selectedCraving: CravingType;
  onSelectCraving: (craving: CravingType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const DecisionBar: React.FC<DecisionBarProps> = ({
  selectedCraving,
  onSelectCraving,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <nav className="sticky top-0 z-30 bg-[#09090B]/95 backdrop-blur-md border-b border-[#27272A] py-2.5 px-4 shadow-lg shadow-black/40">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CRAVING_FILTERS.map((f) => {
            const isActive = selectedCraving === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectCraving(f.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-white bg-[#141417] border border-[#D92D16]/50 shadow-md shadow-[#D92D16]/10'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#141417]/60 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="categoryActiveBar"
                    className="absolute bottom-1 inset-x-2 h-[2px] bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] md:max-w-xs flex-shrink-0">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-[#71717A]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث عن صنف (طرب، كفتة، حواوشي...)"
            className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] focus:shadow-[0_0_0_2px_rgba(255,90,31,0.2)] rounded-xl ps-9 pe-8 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-[#71717A] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
