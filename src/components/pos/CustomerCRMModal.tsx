import React, { useState, useEffect } from 'react';
import { collection, query, limit, getDocs, type Firestore } from 'firebase/firestore';
import type { CustomerRecord } from '../../types/pos';
import { formatCairoDateTime } from '../../utils/businessDate';
import {
  Users,
  Search,
  X,
  Phone,
  ShoppingBag,
  MapPin,
  Calendar,
  PlusCircle,
  Loader2,
} from 'lucide-react';

interface CustomerCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerRecord, selectedAddress?: string) => void;
  db: Firestore | null;
}

export const CustomerCRMModal: React.FC<CustomerCRMModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  db,
}) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Fetch up to 50 recent customers on open
  useEffect(() => {
    if (!isOpen || !db) return;

    let isMounted = true;
    const fetchCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const q = query(collection(db, 'customers'), limit(50));
        const snapshot = await getDocs(q);
        if (!isMounted) return;

        const list: CustomerRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            phone: docSnap.id,
            name: data.name || 'عميل بدون اسم',
            addresses: Array.isArray(data.addresses) ? data.addresses : [],
            ordersCount: Number(data.ordersCount || 0),
            totalSpent: Number(data.totalSpent || 0),
            lastOrderAt: data.lastOrderAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });

        // Sort descending by ordersCount or lastOrderAt
        list.sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));
        setCustomers(list);
      } catch (err: any) {
        console.warn('[CustomerCRMModal] Fetch error:', err);
        if (isMounted) {
          setError('تعذر تحميل بيانات العملاء، تأكد من الاتصال');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      isMounted = false;
    };
  }, [isOpen, db]);

  if (!isOpen) return null;

  // Instant filter by phone or name
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.addresses.some((addr) => addr.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm print:hidden">
      <div
        className="w-full max-w-3xl bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white font-['Cairo',sans-serif]"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#1C1C21]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-[#FF5A1F]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">قاعدة العملاء (CRM)</h3>
              <p className="text-xs text-[#A1A1AA]">
                سجل العملاء المتكررين، العناوين المحفوظة، وسجل الطلبات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#27272A] bg-[#141417]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف أو العنوان..."
              className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-white placeholder-[#52525B] outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-[#71717A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List of Customers */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#09090B]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#A1A1AA] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5A1F]" />
              <span className="text-xs">جاري تحميل سجل العملاء...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-[#D92D16]">{error}</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-[#71717A] space-y-2">
              <Users className="w-10 h-10 mx-auto text-[#27272A]" />
              <p className="text-xs">
                {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا يوجد عملاء مسجلين بعد في قاعدة البيانات'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((cust) => (
              <div
                key={cust.phone}
                className="bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-3.5 transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{cust.name}</span>
                    <span className="text-xs font-mono font-semibold text-[#FF5A1F] dir-ltr inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 inline text-[#71717A]" />
                      {cust.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-[11px] font-bold text-[#FAFAFA] flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-[#FFB020]" />
                      <span>{cust.ordersCount} طلبات</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-bold text-emerald-400">
                      {cust.totalSpent.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>

                {/* Addresses */}
                {cust.addresses && cust.addresses.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-[#71717A] block mb-1">
                      العناوين المسجلة (اضغط لاختيار العنوان للطلب الحالي):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cust.addresses.map((addr, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            onSelectCustomer(cust, addr);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] border border-[#27272A] hover:border-[#FF5A1F]/50 text-xs text-[#FAFAFA] transition-colors flex items-center gap-1 cursor-pointer"
                          title="بدء أوردر بهذا العنوان"
                        >
                          <MapPin className="w-3 h-3 text-[#FF5A1F]" />
                          <span>{addr}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer action */}
                <div className="pt-2 border-t border-[#1C1C21] flex items-center justify-between">
                  <span className="text-[10px] text-[#52525B] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>آخر طلب: </span>
                    <span>
                      {cust.lastOrderAt?.toDate
                        ? formatCairoDateTime(cust.lastOrderAt.toDate())
                        : 'حديثاً'}
                    </span>
                  </span>

                  <button
                    onClick={() => {
                      onSelectCustomer(cust);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#D92D16] hover:bg-[#FF5A1F] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>طلب جديد لهذا العميل</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#27272A] bg-[#141417] flex justify-between items-center text-xs text-[#71717A]">
          <span>إجمالي العملاء المعروضين: {filteredCustomers.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] text-xs font-bold text-white transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
