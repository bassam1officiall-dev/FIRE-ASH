import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const FloatingCartBar: React.FC = () => {
  const { totalCount, totalPrice, setIsCartOpen, isCartOpen } = useCart();

  if (totalCount === 0 || isCartOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 inset-x-4 max-w-xl mx-auto z-40"
      >
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full bg-[#141417]/95 hover:bg-[#1C1C21] backdrop-blur-md border border-[#D92D16]/60 rounded-2xl p-3.5 flex items-center justify-between shadow-2xl shadow-black/80 transition-all cursor-pointer group"
        >
          {/* Left / Start: Bag Icon + Count + Items Thumbnails */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#D92D16] to-[#FF5A1F] flex items-center justify-center text-white shadow-md shadow-[#D92D16]/30 flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-white text-[#D92D16] text-[11px] font-black flex items-center justify-center font-['Oswald'] shadow">
                {totalCount}
              </span>
            </div>

            <div className="text-start">
              <span className="text-xs text-[#A1A1AA] block">
                {totalCount === 1 ? 'صنف واحد في السلة' : `${totalCount} أصناف في السلة`}
              </span>
              <div className="flex items-baseline gap-1 font-['Oswald'] tabular-nums">
                <span className="text-lg font-black text-white">{totalPrice}</span>
                <span className="text-xs font-bold text-[#FF5A1F]">ج.م</span>
              </div>
            </div>
          </div>

          {/* Right / End: Button Action */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] text-white text-xs font-bold shadow group-hover:scale-[1.02] transition-transform">
            <span>مراجعة الطلب</span>
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
