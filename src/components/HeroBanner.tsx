import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame, ShieldCheck, Bike, Clock } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

const TRUST_BADGES = [
  {
    icon: Flame,
    title: 'فحم حي طبيعي',
    desc: 'تتبيلة حصرية وتسوية هادية',
    iconColor: 'text-[#FF5A1F]',
    bgColor: 'bg-[#D92D16]/10',
    borderColor: 'border-[#D92D16]/30',
  },
  {
    icon: Bike,
    title: 'توصيل سريع',
    desc: 'البدرشين، الحوامدية، والمجاور',
    iconColor: 'text-[#FF5A1F]',
    bgColor: 'bg-[#FF5A1F]/10',
    borderColor: 'border-[#FF5A1F]/30',
  },
  {
    icon: ShieldCheck,
    title: 'لحوم بلدي طازة',
    desc: 'تحضير يومي من الجزار للشواية',
    iconColor: 'text-[#FFB020]',
    bgColor: 'bg-[#FFB020]/10',
    borderColor: 'border-[#FFB020]/30',
  },
  {
    icon: Clock,
    title: 'أوقات العمل',
    desc: 'كل يوم من 12 ظهراً لـ 2 صباحاً',
    iconColor: 'text-[#C8CCD0]',
    bgColor: 'bg-[#52525B]/20',
    borderColor: 'border-[#52525B]/40',
  },
];

export const HeroBanner: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

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
            مشويات ع الفحم.. <span className="text-[#FF5A1F]">بالطعم الأصلي</span>
          </h2>

          <p className="mt-2 text-sm text-[#A1A1AA] max-w-md mx-auto font-medium">
            فحم حي، تتبيلة حصرية، طازج دايماً.
          </p>
        </div>

        {/* 4 Trust Signals / Badges with Staggered Entrance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-6">
          {TRUST_BADGES.map((b, index) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={index}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
                className="bg-[#141417] border border-[#27272A] rounded-xl p-3 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-lg ${b.bgColor} border ${b.borderColor} flex items-center justify-center ${b.iconColor} flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">{b.title}</span>
                  <span className="text-[11px] text-[#71717A]">{b.desc}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
