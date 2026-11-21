import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame, ShieldCheck, Bike, Clock, Users, Building2, MessageCircle } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

const cateringInquiryText = encodeURIComponent('السلام عليكم، حابب أستفسر عن تجهيز العزومات والحفلات والمناسبات');
const corporateInquiryText = encodeURIComponent('السلام عليكم، حابب أستفسر عن الأسعار الخاصة للمصانع والشركات وطلبات الكميات');

interface TrustBadge {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  link?: string;
  badgeTag?: string;
}

const TRUST_BADGES: TrustBadge[] = [
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
    desc: 'كل يوم من 11 صباحاً لـ 3:30 فجراً',
    iconColor: 'text-[#C8CCD0]',
    bgColor: 'bg-[#52525B]/20',
    borderColor: 'border-[#52525B]/40',
  },
  {
    icon: Users,
    title: 'العزومات والحفلات',
    desc: 'جاهزون لتجهيز العزومات والحفلات والمناسبات',
    iconColor: 'text-[#FF5A1F]',
    bgColor: 'bg-[#D92D16]/10',
    borderColor: 'border-[#D92D16]/30',
    link: `https://wa.me/201120774455?text=${cateringInquiryText}`,
    badgeTag: 'حجز واتساب',
  },
  {
    icon: Building2,
    title: 'المصانع والشركات',
    desc: 'أسعار خاصة للمصانع والشركات وطلبات الكميات',
    iconColor: 'text-[#FFB020]',
    bgColor: 'bg-[#FFB020]/10',
    borderColor: 'border-[#FFB020]/30',
    link: `https://wa.me/201120774455?text=${corporateInquiryText}`,
    badgeTag: 'عروض الجملة',
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

        {/* 6 Balanced Feature Cards (3x2 Desktop, 2x3 Tablet, 1x6 Mobile 375px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {TRUST_BADGES.map((b, index) => {
            const Icon = b.icon;
            const content = (
              <div className="flex items-center gap-3 w-full">
                <div className={`w-9 h-9 rounded-lg ${b.bgColor} border ${b.borderColor} flex items-center justify-center ${b.iconColor} flex-shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="block text-xs font-bold text-white group-hover:text-[#FF5A1F] transition-colors">{b.title}</span>
                    {b.badgeTag && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#D92D16]/20 text-[#FF5A1F] border border-[#D92D16]/30">
                        <MessageCircle className="w-2.5 h-2.5" />
                        {b.badgeTag}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#71717A] block leading-tight mt-0.5 group-hover:text-[#A1A1AA] transition-colors">{b.desc}</span>
                </div>
              </div>
            );

            return (
              <motion.div
                key={index}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
                className="h-full"
              >
                {b.link ? (
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-[#141417] hover:bg-[#18181D] border border-[#27272A] hover:border-[#FF5A1F]/40 rounded-xl p-3 flex items-center h-full transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-[#D92D16]/10"
                    title={`استفسار واتساب عن ${b.title}`}
                  >
                    {content}
                  </a>
                ) : (
                  <div className="group bg-[#141417] border border-[#27272A] hover:border-[#FF5A1F]/40 rounded-xl p-3 flex items-center h-full transition-all duration-200">
                    {content}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
