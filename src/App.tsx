import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Sandwich, Scale, UtensilsCrossed, Salad, SearchX } from 'lucide-react';
import type { CategoryId, CravingType, MenuItem } from './types/menu';
import { MENU_ITEMS } from './data/menuData';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { DecisionBar } from './components/DecisionBar';
import { MenuItemCard } from './components/MenuItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { FloatingCartBar } from './components/FloatingCartBar';
import { CartDrawer } from './components/CartDrawer';
import { OriginalMenuModal } from './components/OriginalMenuModal';
import { LocationInfoModal } from './components/LocationInfoModal';
import { Footer } from './components/Footer';

const CATEGORY_META: Record<
  CategoryId,
  { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }
> = {
  sandwiches: {
    title: 'ساندوتشات',
    subtitle: 'سندوتشات سخنة في عيش طازة على الجمر',
    icon: Sandwich,
  },
  weights: {
    title: 'الوزنات',
    subtitle: 'كيلو، نص، وربع — على ميزانك',
    icon: Scale,
  },
  meals: {
    title: 'الوجبات',
    subtitle: 'تشكيلات تشبّعك من الآخر',
    icon: UtensilsCrossed,
  },
  sides: {
    title: 'الإضافات والسلطات',
    subtitle: 'طحينة، سلطة بلدي، وأرز مفلفل',
    icon: Salad,
  },
};

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export const App: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedCraving, setSelectedCraving] = useState<CravingType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query and craving filter
  const filteredItems = useMemo(() => {
    let items = MENU_ITEMS;

    // Filter by Craving
    if (selectedCraving !== 'all') {
      items = items.filter((item) => item.cravings.includes(selectedCraving));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter((item) => {
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCat = item.categoryName.toLowerCase().includes(q);
        const matchIng = item.ingredients?.some((ing) => ing.toLowerCase().includes(q)) || false;
        return matchName || matchDesc || matchCat || matchIng;
      });
    }

    return items;
  }, [selectedCraving, searchQuery]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<CategoryId, MenuItem[]> = {
      sandwiches: [],
      weights: [],
      meals: [],
      sides: [],
    };

    filteredItems.forEach((item) => {
      groups[item.categoryId].push(item);
    });

    return groups;
  }, [filteredItems]);

  const totalResults = filteredItems.length;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-['Cairo',sans-serif] selection:bg-[#D92D16] selection:text-white" dir="rtl">
      {/* Top Header */}
      <Header />

      {/* Editorial Hero Banner */}
      <HeroBanner />

      {/* Unified Sticky Category Navigation Bar + Search */}
      <DecisionBar
        selectedCraving={selectedCraving}
        onSelectCraving={setSelectedCraving}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Menu Grid Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {totalResults === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#141417] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-4">
              <SearchX className="w-8 h-8 text-[#FF5A1F]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">لم نعثر على أصناف مطابقة للبحث</h3>
            <p className="text-xs text-[#A1A1AA] max-w-sm mb-5">
              جرب البحث بكلمات أخرى مثل «كفتة»، «طرب»، «حواوشي»، أو قم بإلغاء الفلتر لعرض جميع أصناف المنيو.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCraving('all');
              }}
              className="py-2.5 px-5 rounded-xl bg-[#D92D16] hover:bg-[#FF5A1F] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              عرض جميع الـ 25 صنفاً
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {(['sandwiches', 'weights', 'meals', 'sides'] as CategoryId[]).map((catId) => {
              const items = groupedItems[catId];
              if (items.length === 0) return null;
              const meta = CATEGORY_META[catId];
              const Icon = meta.icon;

              return (
                <section key={catId} id={`category-${catId}`} className="scroll-mt-24">
                  {/* Category Header with Entrance Animation */}
                  <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 mb-6 border-b border-[#27272A]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#141417] border border-[#27272A] flex items-center justify-center text-[#FF5A1F] flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {meta.title}
                          </h2>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#1C1C21] text-[#A1A1AA] font-mono tabular-nums">
                            {items.length} {items.length === 1 ? 'صنف' : 'أصناف'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#FF5A1F] mt-0.5 block">
                          {meta.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="text-start sm:text-end text-[11px] text-[#71717A]">
                      <span>مشويات طازجة بالطلب على الفحم</span>
                    </div>
                  </motion.div>

                  {/* Cards Grid with Staggered Entrance Animation */}
                  <motion.div
                    variants={containerVariants}
                    initial={shouldReduceMotion ? 'show' : 'hidden'}
                    whileInView="show"
                    viewport={{ once: true, margin: '-50px' }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  >
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={shouldReduceMotion ? undefined : cardVariants}
                        className="h-full"
                      >
                        <MenuItemCard item={item} />
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      <FloatingCartBar />

      {/* Checkout WhatsApp Drawer */}
      <CartDrawer />

      {/* Interactive Dish Detail Bottom Sheet */}
      <ItemDetailModal />

      {/* High-Res Original 4 Menu Pages Modal */}
      <OriginalMenuModal />

      {/* Location, Google Maps & Directions Modal */}
      <LocationInfoModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
