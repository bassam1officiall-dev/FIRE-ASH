import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, BookOpen, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';

const MENU_PAGES = [
  { id: 1, title: 'صفحة 1: الساندوتشات', file: '/images/menu-pages/page-1-sandwiches.jpg' },
  { id: 2, title: 'صفحة 2: الوزنات', file: '/images/menu-pages/page-2-weights.jpg' },
  { id: 3, title: 'صفحة 3: الوجبات', file: '/images/menu-pages/page-3-meals.jpg' },
  { id: 4, title: 'صفحة 4: الإضافات وبيانات التواصل', file: '/images/menu-pages/page-4-sides.jpg' },
];

export const OriginalMenuModal: React.FC = () => {
  const { showOriginalMenuModal, setShowOriginalMenuModal } = useCart();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (!showOriginalMenuModal) return null;

  const currentPage = MENU_PAGES[currentPageIndex];

  const handleNext = () => {
    setCurrentPageIndex((prev) => (prev < MENU_PAGES.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentPageIndex((prev) => (prev > 0 ? prev - 1 : MENU_PAGES.length - 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowOriginalMenuModal(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col z-10 max-h-[95vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#27272A] flex items-center justify-between bg-[#09090B]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#FFB020]" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">المنيو الورقي الرسمي — FIRE &amp; ASH</h3>
                <span className="text-xs text-[#A1A1AA]">{currentPage.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={currentPage.file}
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="تحميل الصورة بجودة عالية"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setShowOriginalMenuModal(false)}
                className="p-2 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Page Tabs */}
          <div className="p-2 bg-[#09090B] border-b border-[#27272A] flex gap-1.5 overflow-x-auto no-scrollbar">
            {MENU_PAGES.map((page, idx) => (
              <button
                key={page.id}
                onClick={() => setCurrentPageIndex(idx)}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  currentPageIndex === idx
                    ? 'bg-[#D92D16] text-white shadow'
                    : 'bg-[#141417] text-[#A1A1AA] hover:text-white hover:bg-[#1C1C21]'
                }`}
              >
                {page.title.split(':')[1] || page.title}
              </button>
            ))}
          </div>

          {/* Image Display */}
          <div className="relative flex-1 overflow-auto bg-[#09090B] flex items-center justify-center p-2 min-h-[350px]">
            <img
              src={currentPage.file}
              alt={currentPage.title}
              className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
            />

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer shadow-lg"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm cursor-pointer shadow-lg"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-[#09090B] border-t border-[#27272A] text-center text-xs text-[#71717A]">
            صفحة {currentPageIndex + 1} من {MENU_PAGES.length} • أسعار ومكونات رسمية معتمدة من إدارة المطعم
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
