import React from 'react';
import { motion } from 'framer-motion';
import { Sandwich, Scale, UtensilsCrossed, Salad } from 'lucide-react';
import type { CategoryId } from '../types/menu';

interface CategoryNavProps {
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  categoryCounts: Record<CategoryId, number>;
}

interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'sandwiches', label: 'ساندوتشات', icon: Sandwich },
  { id: 'weights', label: 'الوزنات', icon: Scale },
  { id: 'meals', label: 'الوجبات', icon: UtensilsCrossed },
  { id: 'sides', label: 'الإضافات والسلطات', icon: Salad },
];

export const CategoryNav: React.FC<CategoryNavProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const handleClick = (id: CategoryId) => {
    onSelectCategory(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const yOffset = -100; // accurate offset for sticky header & dock
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-30 bg-[#09090B]/95 backdrop-blur-md border-b border-[#27272A] py-2.5 px-4 shadow-lg shadow-black/40">
      <div className="max-w-6xl mx-auto flex items-center justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar">
        {CATEGORY_TABS.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer select-none ${
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
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF5A1F]' : 'text-[#71717A]'}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
                  isActive ? 'bg-[#D92D16]/30 text-white' : 'bg-[#27272A] text-[#A1A1AA]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
