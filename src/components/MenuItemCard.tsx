import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Info } from 'lucide-react';
import type { MenuItem, WeightOption } from '../types/menu';
import { useCart } from '../context/CartContext';

interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const { addToCart, setActiveItemModal } = useCart();
  const hasWeights = Boolean(item.weights && item.weights.length > 0);

  // For weight items: track selected weight option locally on the card
  const [selectedWeight, setSelectedWeight] = useState<WeightOption>(
    hasWeights && item.weights ? item.weights[0] : { id: 'default', label: '', price: item.price }
  );

  const [justAdded, setJustAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const currentPrice = hasWeights ? selectedWeight.price : item.price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(
      item,
      hasWeights ? selectedWeight : undefined,
      [],
      '',
      1
    );

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleCardClick = () => {
    setActiveItemModal(item);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#141417] hover:bg-[#18181D] border border-[#27272A] hover:border-[#D92D16]/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-md shadow-black/40 hover:shadow-[inset_0_0_0_1px_rgba(217,45,22,0.3),0_10px_25px_-5px_rgba(217,45,22,0.15)]"
    >
      {/* Top: Image & Badges */}
      <div>
        <div className="relative w-full h-44 sm:h-48 bg-[#0D0D10] overflow-hidden">
          {!imgError ? (
            <img
              src={item.image}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1C1C21] to-[#0D0D10] text-[#71717A] p-4 text-center">
              <span className="text-2xl font-black text-[#D92D16]/40 font-['Oswald']">FIRE &amp; ASH</span>
              <span className="text-xs text-[#A1A1AA] mt-1">{item.name}</span>
            </div>
          )}

          {/* Charcoal Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-transparent to-transparent opacity-80" />

          {/* Badges */}
          {item.badge && (
            <div className="absolute top-3 start-3">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#D92D16] text-white shadow-md flex items-center gap-1">
                {item.badge}
              </span>
            </div>
          )}

          {/* Quick detail trigger icon */}
          <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm p-1.5 rounded-lg text-[#FAFAFA]">
            <Info className="w-4 h-4" />
          </div>
        </div>

        {/* Info Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FF5A1F] transition-colors leading-snug">
              {item.name}
            </h3>
          </div>

          <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>

          {/* Ingredients pills if available */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {item.ingredients.slice(0, 3).map((ing, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-[#1C1C21] border border-[#27272A] text-[#A1A1AA] px-2 py-0.5 rounded-md"
                >
                  {ing}
                </span>
              ))}
              {item.ingredients.length > 3 && (
                <span className="text-[10px] text-[#71717A] px-1 py-0.5">
                  +{item.ingredients.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Area: Weights Selector (if applicable) & Price / Action */}
      <div className="p-4 pt-0">
        {/* Interactive Segmented Weight Switcher for الوزنات */}
        {hasWeights && item.weights && (
          <div
            className="mb-3 p-1 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {item.weights.map((w) => {
              const isSelected = selectedWeight.id === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWeight(w)}
                  className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer relative text-center ${isSelected
                    ? 'text-white'
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#141417]'
                    }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId={`weightHighlight-${item.id}`}
                      className="absolute inset-0 bg-[#27272A] border border-[#D92D16]/50 rounded-lg"
                      transition={{ type: 'spring', stiffness: 600, damping: 40 }}
                    />
                  )}
                  <span className="relative z-10 block truncate">{w.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Price & Add Button Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1C1C21]">
          <div>
            <span className="text-[11px] text-[#71717A] block">السعر</span>
            <div className="flex items-baseline gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentPrice}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="text-lg sm:text-xl font-black text-white font-['Oswald'] tabular-nums"
                >
                  {currentPrice}
                </motion.span>
              </AnimatePresence>
              <span className="text-xs font-bold text-[#FF5A1F]">ج.م</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickAdd}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] hover:from-[#FF5A1F] hover:to-[#D92D16] text-white shadow-md shadow-[#D92D16]/20 active:scale-95'
                }`}
              title="إضافة سريعة إلى السلة"
            >
              <AnimatePresence mode="wait" initial={false}>
                {justAdded ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>تمت الإضافة</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
