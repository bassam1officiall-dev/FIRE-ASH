import React from 'react';
import { Phone, MessageCircle, MapPin, Flame, BookOpen } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';
import { useCart } from '../context/CartContext';

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const Footer: React.FC = () => {
  const { setShowOriginalMenuModal, setShowLocationModal } = useCart();

  return (
    <footer className="bg-[#09090B] border-t border-[#27272A] mt-16 pt-12 pb-24 sm:pb-12 text-[#A1A1AA] text-xs">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#1C1C21]">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo/fire-ash-logo.webp"
                alt="شعار FIRE & ASH"
                className="w-12 h-12 object-contain rounded-xl bg-[#141417] p-1 border border-[#27272A]"
              />
              <div>
                <h4 className="text-base font-black text-white font-['Oswald']">
                  FIRE &amp; ASH — TASTE THE FLAME
                </h4>
                <span className="text-xs text-[#FF5A1F] font-semibold">{RESTAURANT_INFO.slogan}</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#71717A] max-w-md">
              من البدرشين للبيوت. فحم حي — مش هواء، وتتبيلة معمولة بمزاج.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              روابط سريعة
            </h5>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setShowOriginalMenuModal(true)}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#FFB020]" />
                  <span>المنيو الورقي الرسمي</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                  <span>موقع المطعم ومناطق التوصيل</span>
                </button>
              </li>
              <li>
                <a
                  href={RESTAURANT_INFO.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>صفحتنا على فيسبوك</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Order */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              التواصل والطلبات
            </h5>
            <p className="text-xs text-[#71717A]">
              العنوان: {RESTAURANT_INFO.address}
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <a
                href={RESTAURANT_INFO.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#141417] hover:bg-[#1C1C21] border border-[#27272A] text-white text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>واتساب: {RESTAURANT_INFO.phoneDisplay}</span>
              </a>
              <a
                href={`tel:${RESTAURANT_INFO.phone}`}
                className="inline-flex items-center gap-2 py-2 px-3 rounded-lg bg-[#141417] hover:bg-[#1C1C21] border border-[#27272A] text-white text-xs font-bold transition-colors font-mono"
                dir="ltr"
              >
                <Phone className="w-4 h-4 text-[#D92D16]" />
                <span>{RESTAURANT_INFO.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start text-[#71717A]">
          <p>
            جميع الحقوق محفوظة لمطعم <strong className="text-white">FIRE &amp; ASH</strong> — البدرشين © 2026
          </p>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Flame className="w-3 h-3 text-[#FF5A1F]" />
            <span>نكهة الفحم الحي بطعم مختلف</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
