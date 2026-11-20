import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Sparkles } from 'lucide-react';
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
    <div className="bg-[#141417] border-b border-[#27272A] py-3 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Craving Filter Section */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-bold flex-shrink-0 pe-2 border-e border-[#27272A]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" />
            <span>محتار تطلب؟</span>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap">
            {CRAVING_FILTERS.map((f) => {
              const isActive = selectedCraving === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectCraving(f.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer select-none ${
                    isActive ? 'text-white' : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1C1C21]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="cravingPill"
                      className="absolute inset-0 bg-[#D92D16] rounded-lg shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </button>
              );
            })}
          </div>
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
            className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl ps-9 pe-8 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none transition-colors"
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
    </div>
  );
};
