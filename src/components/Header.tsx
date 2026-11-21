import React from 'react';
import { Phone, MapPin, MessageCircle, BookOpen, Clock } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';
import { useCart } from '../context/CartContext';

export const Header: React.FC = () => {
  const { setShowOriginalMenuModal, setShowLocationModal } = useCart();

  return (
    <header className="relative bg-[#09090B] border-b border-[#27272A] overflow-hidden">
      {/* Subtle Rising Embers Animation in Header (GPU transform only) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
        <span className="absolute bottom-2 left-[15%] w-2 h-2 bg-[#FF5A1F] rounded-full blur-[1px] animate-ember" style={{ '--duration': '5.2s', '--drift-x': '-12px' } as React.CSSProperties} />
        <span className="absolute bottom-1 left-[32%] w-2.5 h-2.5 bg-[#D92D16] rounded-full blur-[1px] animate-ember" style={{ '--duration': '4.1s', '--drift-x': '18px' } as React.CSSProperties} />
        <span className="absolute bottom-2 left-[48%] w-2 h-2 bg-[#FF5A1F] rounded-full blur-[1px] animate-ember" style={{ '--duration': '4.6s', '--drift-x': '8px' } as React.CSSProperties} />
        <span className="absolute bottom-3 left-[62%] w-1.5 h-1.5 bg-[#FFB020] rounded-full blur-[1px] animate-ember" style={{ '--duration': '6.0s', '--drift-x': '-24px' } as React.CSSProperties} />
        <span className="absolute bottom-2 left-[82%] w-2.5 h-2.5 bg-[#FF5A1F] rounded-full blur-[1px] animate-ember" style={{ '--duration': '4.8s', '--drift-x': '14px' } as React.CSSProperties} />
      </div>

      {/* Top Utility Bar */}
      <div className="max-w-6xl mx-auto px-4 py-2 border-b border-[#1C1C21] flex items-center justify-between text-xs text-[#A1A1AA]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-medium">مفتوح للطلبات الآن</span>
          <span className="hidden sm:inline-block text-[#3F3F46]">•</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#71717A]" />
            {RESTAURANT_INFO.hours}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLocationModal(true)}
            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            title="عنوان المطعم في البدرشين"
          >
            <MapPin className="w-3 h-3 text-[#FF5A1F]" />
            <span className="hidden xs:inline">البدرشين — طريق أبو ربع</span>
            <span className="xs:hidden">العنوان</span>
          </button>
          <span className="text-[#3F3F46]">|</span>
          <a
            href={`tel:${RESTAURANT_INFO.phone}`}
            className="hover:text-white transition-colors flex items-center gap-1 font-mono"
            dir="ltr"
          >
            <Phone className="w-3 h-3 text-[#D92D16]" />
            {RESTAURANT_INFO.phoneDisplay}
          </a>
        </div>
      </div>

      {/* Main Header Brand Bar */}
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-4 text-center sm:text-start">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#141417] border border-[#27272A] p-1.5 shadow-lg flex-shrink-0 flex items-center justify-center overflow-hidden group">
            <img
              src="/images/logo/fire-ash-logo.webp"
              alt="شعار مطعم FIRE & ASH"
              className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Oswald',sans-serif]">
                FIRE &amp; ASH
              </h1>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#D92D16]/20 text-[#FF5A1F] border border-[#D92D16]/40 rounded-full">
                TASTE THE FLAME
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 font-medium">
              مطعم مشويات على الفحم - البدرشين
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
          {/* View Original Printed Menu */}
          <button
            onClick={() => setShowOriginalMenuModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#141417] hover:bg-[#1C1C21] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-[#FFB020]" />
            <span>المنيو الورقي الأصلي</span>
          </button>

          {/* Direct WhatsApp Callout */}
          <a
            href={RESTAURANT_INFO.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] hover:from-[#FF5A1F] hover:to-[#D92D16] text-xs font-bold text-white shadow-lg shadow-[#D92D16]/20 transition-all cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>طلب واتساب مباشر</span>
          </a>
        </div>
      </div>
    </header>
  );
};
