import React from 'react';
import { Flame, ShieldCheck, Bike, Sparkles } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative bg-[#09090B] border-b border-[#27272A] py-6 sm:py-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Editorial Brand Heading */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D92D16]/10 border border-[#D92D16]/25 text-xs text-[#FF5A1F] font-semibold mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>{RESTAURANT_INFO.slogan}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#FAFAFA] tracking-tight leading-tight">
            مش بس أكل.. ده <span className="text-[#FF5A1F]">تجربة نار</span> على الفحم
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-[#A1A1AA] leading-relaxed max-w-xl mx-auto">
            منيو تفاعلي يضم الساندوتشات السريعة، وجبات الأكيلة المتكاملة، ومشويات الفحم بالوزن الطازجة والمتبلة بخلطة فاير الحصرية في البدرشين.
          </p>
        </div>

        {/* 4 Trust Signals / Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-6">
          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D92D16]/10 border border-[#D92D16]/30 flex items-center justify-center text-[#FF5A1F] flex-shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">فحم حي طبيعي</span>
              <span className="text-[11px] text-[#71717A]">تتبيلة وطعم تدخين أصيل</span>
            </div>
          </div>

          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 flex items-center justify-center text-[#FF5A1F] flex-shrink-0">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">توصيل سريع</span>
              <span className="text-[11px] text-[#71717A]">البدرشين والمناطق المجاورة</span>
            </div>
          </div>

          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFB020]/10 border border-[#FFB020]/30 flex items-center justify-center text-[#FFB020] flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">لحوم بلدية طازجة</span>
              <span className="text-[11px] text-[#71717A]">تحضير يومي بأعلى معايير</span>
            </div>
          </div>

          <div className="bg-[#141417] border border-[#27272A] rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#52525B]/20 border border-[#52525B]/40 flex items-center justify-center text-[#C8CCD0] flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">طلب مباشر واتساب</span>
              <span className="text-[11px] text-[#71717A]">تأكيد فوري خلال ثوانٍ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
