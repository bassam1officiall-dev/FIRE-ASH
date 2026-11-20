import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, MessageCircle, Clock, ExternalLink, Bike } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';
import { useCart } from '../context/CartContext';

export const LocationInfoModal: React.FC = () => {
  const { showLocationModal, setShowLocationModal } = useCart();

  if (!showLocationModal) return null;

  const mapsQuery = encodeURIComponent(`مطعم FIRE & ASH البدرشين طريق ابو ربع`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowLocationModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl p-6 z-10 overflow-hidden"
        >
          {/* Close */}
          <button
            onClick={() => setShowLocationModal(false)}
            className="absolute top-4 end-4 w-8 h-8 rounded-full bg-[#1C1C21] hover:bg-[#27272A] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#D92D16]/10 border border-[#D92D16]/30 flex items-center justify-center text-[#FF5A1F]">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">عنوان وتواصل FIRE &amp; ASH</h3>
              <p className="text-xs text-[#A1A1AA]">مطعم ومشويات الفحم الحي بالبدرشين</p>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Address */}
            <div className="p-3.5 bg-[#09090B] border border-[#27272A] rounded-xl flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#FF5A1F] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">العنوان بالتفصيل:</span>
                <p className="text-[#C8CCD0] leading-relaxed">
                  {RESTAURANT_INFO.address}
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="p-3.5 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FFB020] flex-shrink-0" />
              <div>
                <span className="font-bold text-white block mb-0.5">مواعيد العمل:</span>
                <span className="text-[#C8CCD0]">{RESTAURANT_INFO.hours}</span>
              </div>
            </div>

            {/* Delivery Areas */}
            <div className="p-3.5 bg-[#09090B] border border-[#27272A] rounded-xl flex items-start gap-3">
              <Bike className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">مناطق التوصيل:</span>
                <span className="text-[#C8CCD0] leading-relaxed">
                  خدمة دليفري سريعة تغطي مدينة البدرشين، طريق أبو ربع، ومحيط المسجد والمناطق والقرى المجاورة.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <a
              href={`tel:${RESTAURANT_INFO.phone}`}
              className="py-3 px-4 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] border border-[#27272A] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#D92D16]" />
              <span>اتصال هاتفياً</span>
            </a>

            <a
              href={RESTAURANT_INFO.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow"
            >
              <MessageCircle className="w-4 h-4" />
              <span>محادثة واتساب</span>
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 py-3 px-4 rounded-xl bg-[#09090B] hover:bg-[#141417] border border-[#27272A] text-[#A1A1AA] hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-[#FF5A1F]" />
              <span>فتح الموقع على خرائط Google Maps</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
