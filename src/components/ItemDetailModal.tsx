import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Sparkles, Flame } from 'lucide-react';
import type { WeightOption, AddOnOption } from '../types/menu';
import { UPSELL_ADDONS } from '../data/menuData';
import { useCart } from '../context/CartContext';

const NOTE_CHIPS = [
  'بدون بصل',
  'حار / سبايسي',
  'طحينة زيادة',
  'عيش محمص',
  'تسوية زيادة',
];

export const ItemDetailModal: React.FC = () => {
  const { activeItemModal, setActiveItemModal, addToCart, setIsCartOpen } = useCart();

  const [selectedWeight, setSelectedWeight] = useState<WeightOption | undefined>(undefined);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');

  // Reset state when active item changes
  useEffect(() => {
    if (activeItemModal) {
      if (activeItemModal.weights && activeItemModal.weights.length > 0) {
        setSelectedWeight(activeItemModal.weights[0]);
      } else {
        setSelectedWeight(undefined);
      }
      setSelectedAddOns([]);
      setQuantity(1);
      setCustomNote('');
    }
  }, [activeItemModal]);

  if (!activeItemModal) return null;

  const hasWeights = Boolean(activeItemModal.weights && activeItemModal.weights.length > 0);
  const basePrice = selectedWeight ? selectedWeight.price : activeItemModal.price;
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addOnsTotal;
  const grandTotal = unitPrice * quantity;

  const toggleAddOn = (addon: AddOnOption) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleChipClick = (chip: string) => {
    if (customNote.includes(chip)) {
      setCustomNote((prev) => prev.replace(chip, '').replace(/,\s*,/g, ',').trim());
    } else {
      setCustomNote((prev) => (prev ? `${prev}، ${chip}` : chip));
    }
  };

  const handleAddToCart = () => {
    addToCart(
      activeItemModal,
      selectedWeight,
      selectedAddOns,
      customNote,
      quantity
    );
    setActiveItemModal(null);
    setIsCartOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveItemModal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg bg-[#141417] border border-[#27272A] rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col z-10 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => setActiveItemModal(null)}
            className="absolute top-4 end-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 no-scrollbar pb-24">
            {/* Dish Image */}
            <div className="relative w-full h-56 sm:h-64 bg-[#09090B]">
              <img
                src={activeItemModal.image}
                alt={activeItemModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-transparent to-black/40" />
              {activeItemModal.badge && (
                <div className="absolute top-4 start-4">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#D92D16] text-white shadow-lg flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    {activeItemModal.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Header Details */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {activeItemModal.name}
                  </h2>
                  <span className="text-xs text-[#A1A1AA] mt-0.5 block">
                    {activeItemModal.categoryName} • على الفحم الحي
                  </span>
                </div>

                <div className="text-end">
                  <div className="text-2xl font-black text-[#FF5A1F] font-['Oswald'] tabular-nums">
                    {unitPrice} <span className="text-sm font-bold">ج.م</span>
                  </div>
                  {quantity > 1 && (
                    <span className="text-[11px] text-[#71717A] block">
                      للقطعة الواحدة
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#C8CCD0] mt-3 leading-relaxed">
                {activeItemModal.description}
              </p>

              {/* Ingredients Breakdown */}
              {activeItemModal.ingredients && activeItemModal.ingredients.length > 0 && (
                <div className="mt-4 p-3 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <span className="text-xs font-bold text-[#A1A1AA] block mb-2">
                    المكونات وطريقة التحضير:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeItemModal.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="text-xs bg-[#1C1C21] text-[#FAFAFA] border border-[#27272A] px-2.5 py-1 rounded-lg"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weights Selector (if applicable) */}
              {hasWeights && activeItemModal.weights && (
                <div className="mt-5">
                  <label className="text-xs font-bold text-[#FAFAFA] block mb-2 flex items-center justify-between">
                    <span>اختر الوزن / الحجم:</span>
                    <span className="text-[#FF5A1F] text-[11px]">مطلوب</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {activeItemModal.weights.map((w) => {
                      const isSelected = selectedWeight?.id === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWeight(w)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1C1C21] border-[#D92D16] text-white shadow-md shadow-[#D92D16]/20'
                              : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                          }`}
                        >
                          <span className="block text-xs font-bold">{w.label}</span>
                          <span className="block text-sm font-black text-[#FF5A1F] mt-1 font-['Oswald'] tabular-nums">
                            {w.price} ج.م
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1-Tap Upsell Section ("كمّل أكلك") */}
              <div className="mt-6 pt-5 border-t border-[#27272A]">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-[#FFB020]" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    كمّل أكلك مع الطلب (إضافات وسلطات):
                  </h4>
                </div>

                <div className="space-y-2">
                  {UPSELL_ADDONS.map((addon) => {
                    const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddOn(addon)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#1C1C21] border-[#D92D16]/70 text-white'
                            : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              isSelected
                                ? 'bg-[#D92D16] border-[#D92D16] text-white'
                                : 'border-[#3F3F46] bg-[#141417]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-medium text-[#FAFAFA]">{addon.name}</span>
                        </div>
                        <span className="text-xs font-black text-[#FF5A1F] font-['Oswald'] tabular-nums">
                          +{addon.price} ج.م
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions / Notes */}
              <div className="mt-6 pt-5 border-t border-[#27272A]">
                <label className="text-xs font-bold text-white block mb-2">
                  ملاحظات خاصة على الوجبة:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {NOTE_CHIPS.map((chip) => {
                    const active = customNote.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#D92D16]/20 border-[#D92D16] text-white'
                            : 'bg-[#09090B] border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="أي طلب إضافي للشيف (مثال: بدون فلفل، تسوية خفيفة...)"
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Bar inside Modal */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-[#141417]/95 backdrop-blur-md border-t border-[#27272A] flex items-center gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 bg-[#09090B] border border-[#27272A] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-white font-['Oswald'] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Submit Add Button */}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] hover:from-[#FF5A1F] hover:to-[#D92D16] text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-[#D92D16]/20 transition-all cursor-pointer active:scale-98"
            >
              <span>إضافة إلى الطلب</span>
              <div className="flex items-baseline gap-1 font-['Oswald'] tabular-nums">
                <span className="text-lg font-black">{grandTotal}</span>
                <span className="text-xs">ج.م</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
