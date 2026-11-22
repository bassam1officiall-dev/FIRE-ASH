import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut, onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { isManager } from '../utils/auth';
import { getBusinessDate, formatCairoTime } from '../utils/businessDate';
import { recordOrderDailySummary, cancelOrderDailySummary } from '../utils/dailySummary';
import { useMenu } from '../context/MenuContext';
import type { MenuItem, WeightOption, CategoryId } from '../types/menu';
import type {
  POSOrder,
  POSOrderItem,
  POSOrderType,
  POSPaymentMethod,
  CustomerRecord,
} from '../types/pos';
import { ReceiptPrinter, type PrintMode } from '../components/pos/ReceiptPrinter';
import { CustomerCRMModal } from '../components/pos/CustomerCRMModal';
import {
  Flame,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Users,
  LogOut,
  Shield,
  UtensilsCrossed,
  Scale,
  Sandwich,
  Salad,
  Clock,
  Wifi,
  WifiOff,
  Phone,
  MapPin,
  FileText,
  X,
  CreditCard,
  Banknote,
  Send,
  Loader2,
  Edit3,
  Ban,
} from 'lucide-react';

const CATEGORY_TABS: { id: CategoryId | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'الكل', icon: Flame },
  { id: 'sandwiches', label: 'ساندوتشات', icon: Sandwich },
  { id: 'weights', label: 'الوزنات', icon: Scale },
  { id: 'meals', label: 'الوجبات', icon: UtensilsCrossed },
  { id: 'sides', label: 'الإضافات والسلطات', icon: Salad },
];

const QUICK_KITCHEN_CHIPS = ['بدون بصل', 'حار', 'زيادة طحينة', 'عيش محمص'];

export const CashierPOS: React.FC = () => {
  const navigate = useNavigate();
  const { items: menuItems, loading: menuLoading } = useMenu();

  // Current authenticated user
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Online / Offline Status
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Active Tab: 'pos' (Workspace) | 'orders' (Shift Orders)
  const [activeTab, setActiveTab] = useState<'pos' | 'orders'>('pos');

  // Business Date for current active shift
  const [currentBusinessDate, setCurrentBusinessDate] = useState<string>(() => getBusinessDate());

  // Menu Search & Filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Ticket State
  const [orderType, setOrderType] = useState<POSOrderType>('takeaway');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('cash');
  const [ticketItems, setTicketItems] = useState<POSOrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Editing existing order state
  const [editingOrder, setEditingOrder] = useState<POSOrder | null>(null);

  // Customer CRM inside ticket
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [crmRecord, setCrmRecord] = useState<CustomerRecord | null>(null);
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);

  // Today's shift orders from Firestore (quota-safe: filtered by businessDate)
  const [shiftOrders, setShiftOrders] = useState<POSOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Shift orders search & filter
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersFilterType, setOrdersFilterType] = useState<'all' | POSOrderType>('all');

  // Customer CRM Modal State
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);

  // Thermal Receipt Printing State
  const [printOrder, setPrintOrder] = useState<POSOrder | null>(null);
  const [printMode, setPrintMode] = useState<PrintMode>('both');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update business date periodically (e.g. shift boundary at 05:00 AM)
  useEffect(() => {
    const timer = setInterval(() => {
      const bDate = getBusinessDate();
      if (bDate !== currentBusinessDate) {
        setCurrentBusinessDate(bDate);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [currentBusinessDate]);

  // Auth state listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login?redirect=/cashier', { replace: true });
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Subscribe to shift orders for today's businessDate
  useEffect(() => {
    if (!db) {
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    const ordersRef = collection(db, 'orders');
    // Query quota-safe by businessDate
    const q = query(ordersRef, where('businessDate', '==', currentBusinessDate));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: POSOrder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            orderNumber: data.orderNumber || `#${docSnap.id.slice(0, 4)}`,
            dailyOrderSeq: Number(data.dailyOrderSeq || 0),
            businessDate: data.businessDate || currentBusinessDate,
            orderType: data.orderType || 'takeaway',
            tableNumber: data.tableNumber || undefined,
            paymentMethod: data.paymentMethod || 'cash',
            status: data.status || 'completed',
            customerName: data.customerName || undefined,
            customerPhone: data.customerPhone || undefined,
            deliveryAddress: data.deliveryAddress || undefined,
            items: Array.isArray(data.items) ? data.items : [],
            subtotal: Number(data.subtotal || 0),
            deliveryFee: Number(data.deliveryFee || 0),
            discount: Number(data.discount || 0),
            finalTotal: Number(data.finalTotal || 0),
            notes: data.notes || undefined,
            createdBy: data.createdBy || '',
            createdByName: data.createdByName || undefined,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });

        // Sort descending by sequence/timestamp
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA || (b.dailyOrderSeq || 0) - (a.dailyOrderSeq || 0);
        });

        setShiftOrders(list);
        setOrdersLoading(false);
      },
      (error) => {
        console.warn('[CashierPOS] Orders subscription error:', error);
        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentBusinessDate]);

  // Smart CRM: Phone Auto-Lookup (when 11-digit Egyptian phone is typed)
  useEffect(() => {
    const cleanPhone = customerPhone.trim();
    // Egyptian mobile format: 010, 011, 012, 015 followed by 8 digits (11 digits total)
    const isValidEgyptianMobile = /^01[0125][0-9]{8}$/.test(cleanPhone);

    if (!isValidEgyptianMobile || !db) {
      if (cleanPhone.length < 11) {
        setCrmRecord(null);
      }
      return;
    }

    let isMounted = true;
    const currentDb = db;
    if (!currentDb) return;

    const lookupCustomer = async () => {
      setIsLookingUpCustomer(true);
      try {
        const docRef = doc(currentDb, 'customers', cleanPhone);
        const docSnap = await getDoc(docRef);
        if (!isMounted) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const rec: CustomerRecord = {
            phone: cleanPhone,
            name: data.name || '',
            addresses: Array.isArray(data.addresses) ? data.addresses : [],
            ordersCount: Number(data.ordersCount || 0),
            totalSpent: Number(data.totalSpent || 0),
            lastOrderAt: data.lastOrderAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
          setCrmRecord(rec);
          // Auto-fill customer name if not already filled
          if (!customerName && rec.name) {
            setCustomerName(rec.name);
          }
          // If delivery and addresses exist, prefill first address if none selected
          if (orderType === 'delivery' && !deliveryAddress && rec.addresses.length > 0) {
            setDeliveryAddress(rec.addresses[0]);
          }
          showToast(`تم التعرف على العميل: ${rec.name || 'عميل مسجل'} (${rec.ordersCount} طلبات)`, 'info');
        } else {
          setCrmRecord(null);
        }
      } catch (err) {
        console.warn('[CashierPOS] Customer lookup error:', err);
      } finally {
        if (isMounted) setIsLookingUpCustomer(false);
      }
    };

    lookupCustomer();
    return () => {
      isMounted = false;
    };
  }, [customerPhone, orderType, customerName, deliveryAddress]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Arabic search query match
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const categoryMatch = item.categoryName?.toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !categoryMatch) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Ticket calculations
  const subtotal = useMemo(() => {
    return ticketItems.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [ticketItems]);

  const finalTotal = useMemo(() => {
    const total = subtotal + Number(deliveryFee || 0) - Number(discount || 0);
    return total > 0 ? total : 0;
  }, [subtotal, deliveryFee, discount]);

  // Add Item to Ticket (standard or weighted)
  const addItemToTicket = (item: MenuItem, weightOpt?: WeightOption) => {
    const unitPrice = weightOpt ? weightOpt.price : item.price;
    const weightLabel = weightOpt ? weightOpt.label : undefined;

    setTicketItems((prev) => {
      // Check if same item with same weight already exists
      const existingIdx = prev.findIndex(
        (i) => i.itemId === item.id && i.weightLabel === weightLabel
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const current = updated[existingIdx];
        const newQty = current.quantity + 1;
        updated[existingIdx] = {
          ...current,
          quantity: newQty,
          totalPrice: newQty * current.price,
        };
        return updated;
      }

      // Add new line item
      const newItem: POSOrderItem = {
        itemId: item.id,
        name: item.name,
        categoryId: item.categoryId,
        price: unitPrice,
        weightLabel,
        quantity: 1,
        kitchenNotes: [],
        customNote: '',
        totalPrice: unitPrice,
      };
      return [...prev, newItem];
    });
  };

  // Modify Item Quantity
  const updateItemQuantity = (index: number, delta: number) => {
    setTicketItems((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        // Remove item if quantity falls to 0
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = {
        ...target,
        quantity: newQty,
        totalPrice: newQty * target.price,
      };
      return updated;
    });
  };

  // Remove Item
  const removeItemFromTicket = (index: number) => {
    setTicketItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle Kitchen Note chip on an item
  const toggleKitchenNote = (index: number, note: string) => {
    setTicketItems((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const exists = target.kitchenNotes.includes(note);
      const newNotes = exists
        ? target.kitchenNotes.filter((n) => n !== note)
        : [...target.kitchenNotes, note];
      updated[index] = {
        ...target,
        kitchenNotes: newNotes,
      };
      return updated;
    });
  };

  // Set Custom Kitchen Note
  const setCustomKitchenNote = (index: number, customNote: string) => {
    setTicketItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        customNote,
      };
      return updated;
    });
  };

  // Reset / Clear Active Ticket
  const resetTicket = () => {
    setTicketItems([]);
    setOrderNotes('');
    setDeliveryFee(0);
    setDiscount(0);
    setCustomerPhone('');
    setCustomerName('');
    setDeliveryAddress('');
    setCrmRecord(null);
    setTableNumber('');
    setEditingOrder(null);
  };

  // Select customer from CRM modal
  const handleSelectCustomerFromCRM = (cust: CustomerRecord, selectedAddress?: string) => {
    setCustomerPhone(cust.phone);
    setCustomerName(cust.name);
    setCrmRecord(cust);
    if (selectedAddress) {
      setDeliveryAddress(selectedAddress);
      setOrderType('delivery');
    } else if (cust.addresses.length > 0) {
      setDeliveryAddress(cust.addresses[0]);
    }
    setActiveTab('pos');
    showToast(`تم اختيار العميل: ${cust.name}`, 'success');
  };

  // Load existing order into active ticket for editing
  const loadOrderForEditing = (order: POSOrder) => {
    setEditingOrder(order);
    setOrderType(order.orderType);
    setTableNumber(order.tableNumber || '');
    setPaymentMethod(order.paymentMethod);
    setCustomerPhone(order.customerPhone || '');
    setCustomerName(order.customerName || '');
    setDeliveryAddress(order.deliveryAddress || '');
    setTicketItems(order.items);
    setDeliveryFee(order.deliveryFee || 0);
    setDiscount(order.discount || 0);
    setOrderNotes(order.notes || '');
    setActiveTab('pos');
    showToast(`تم تحميل الأوردر ${order.orderNumber} للتعديل`, 'info');
  };

  // Save Order (with optional print trigger)
  const handleSaveOrder = async (printOption?: PrintMode) => {
    if (ticketItems.length === 0) {
      showToast('يرجى إضافة أصناف إلى الأوردر أولاً', 'error');
      return;
    }

    if (!db) {
      showToast('قاعدة بيانات فايربيس غير متصلة', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const cleanPhone = customerPhone.trim();
      const cleanName = customerName.trim();
      const cleanAddress = deliveryAddress.trim();

      // 1. Smart Customer CRM Auto-Upsert
      if (cleanPhone) {
        try {
          const custRef = doc(db, 'customers', cleanPhone);
          const updatePayload: any = {
            phone: cleanPhone,
            name: cleanName || 'عميل مسجل',
            ordersCount: increment(editingOrder ? 0 : 1),
            totalSpent: increment(finalTotal),
            lastOrderAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          if (cleanAddress) {
            updatePayload.addresses = arrayUnion(cleanAddress);
          }

          await setDoc(custRef, updatePayload, { merge: true });
        } catch (crmErr) {
          console.warn('[CashierPOS] CRM upsert error:', crmErr);
        }
      }

      // 2. Prepare Order Payload
      if (editingOrder) {
        // Update Existing Order
        const orderRef = doc(db, 'orders', editingOrder.id);
        const updatedOrder: POSOrder = {
          ...editingOrder,
          orderType,
          tableNumber: orderType === 'dine_in' ? tableNumber : '',
          paymentMethod,
          customerName: cleanName || undefined,
          customerPhone: cleanPhone || undefined,
          deliveryAddress: cleanAddress || undefined,
          items: ticketItems,
          subtotal,
          deliveryFee,
          discount,
          finalTotal,
          notes: orderNotes || undefined,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(orderRef, {
          orderType: updatedOrder.orderType,
          tableNumber: updatedOrder.tableNumber,
          paymentMethod: updatedOrder.paymentMethod,
          customerName: updatedOrder.customerName || '',
          customerPhone: updatedOrder.customerPhone || '',
          deliveryAddress: updatedOrder.deliveryAddress || '',
          items: updatedOrder.items,
          subtotal: updatedOrder.subtotal,
          deliveryFee: updatedOrder.deliveryFee,
          discount: updatedOrder.discount,
          finalTotal: updatedOrder.finalTotal,
          notes: updatedOrder.notes || '',
          updatedAt: updatedOrder.updatedAt,
        });

        // Atomic Daily Summary Adjustment
        await recordOrderDailySummary(db, updatedOrder, false, editingOrder);

        showToast(`تم تحديث الأوردر ${editingOrder.orderNumber} بنجاح`, 'success');

        if (printOption) {
          setPrintOrder(updatedOrder);
          setPrintMode(printOption);
          setTimeout(() => window.print(), 250);
        }

        resetTicket();
      } else {
        // Create New Order
        // Calculate daily sequence number based on active shift count
        const dailySeq = shiftOrders.length + 1;
        const orderNumber = `#${String(dailySeq).padStart(3, '0')}`;

        const newOrderRef = doc(collection(db, 'orders'));
        const newOrder: POSOrder = {
          id: newOrderRef.id,
          orderNumber,
          dailyOrderSeq: dailySeq,
          businessDate: currentBusinessDate,
          orderType,
          tableNumber: orderType === 'dine_in' ? tableNumber : '',
          paymentMethod,
          status: 'completed',
          customerName: cleanName || undefined,
          customerPhone: cleanPhone || undefined,
          deliveryAddress: cleanAddress || undefined,
          items: ticketItems,
          subtotal,
          deliveryFee,
          discount,
          finalTotal,
          notes: orderNotes || undefined,
          createdBy: currentUser?.email || 'cashier@fireandash.local',
          createdByName: currentUser?.displayName || (isManager(currentUser) ? 'المدير' : 'الكاشير'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(newOrderRef, newOrder);

        // Atomic Daily Summary Rollup
        await recordOrderDailySummary(db, newOrder, true);

        showToast(`تم حفظ الأوردر ${orderNumber} بنجاح (${finalTotal} ج.م)`, 'success');

        if (printOption) {
          setPrintOrder(newOrder);
          setPrintMode(printOption);
          setTimeout(() => window.print(), 250);
        }

        resetTicket();
      }
    } catch (err: any) {
      console.error('[CashierPOS] Save order error:', err);
      showToast('تعذر حفظ الأوردر: ' + (err.message || 'خطأ غير متوقع'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel an existing order
  const handleCancelOrder = async (order: POSOrder) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في إلغاء الأوردر ${order.orderNumber}؟ سيتم خصم قيمته من الإجمالي اليومي.`)) {
      return;
    }

    if (!db) return;

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      // Atomically reverse daily summary counters
      await cancelOrderDailySummary(db, order);

      showToast(`تم إلغاء الأوردر ${order.orderNumber} وتعديل الوردية`, 'info');
    } catch (err: any) {
      console.error('[CashierPOS] Cancel order error:', err);
      showToast('تعذر إلغاء الأوردر: ' + (err.message || 'خطأ غير متوقع'), 'error');
    }
  };

  // Print Order Trigger
  const triggerPrintForOrder = (order: POSOrder, mode: PrintMode) => {
    setPrintOrder(order);
    setPrintMode(mode);
    setIsPrintModalOpen(true);
  };

  // Handle Logout
  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      navigate('/admin/login', { replace: true });
    }
  };

  // Shift orders metrics for today
  const shiftMetrics = useMemo(() => {
    const activeOrders = shiftOrders.filter((o) => o.status === 'completed');
    const totalSales = activeOrders.reduce((sum, o) => sum + o.finalTotal, 0);
    const cashTotal = activeOrders.filter((o) => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.finalTotal, 0);
    const vodafoneTotal = activeOrders.filter((o) => o.paymentMethod === 'vodafone_cash').reduce((sum, o) => sum + o.finalTotal, 0);
    const instapayTotal = activeOrders.filter((o) => o.paymentMethod === 'instapay').reduce((sum, o) => sum + o.finalTotal, 0);

    return {
      totalCount: activeOrders.length,
      cancelledCount: shiftOrders.filter((o) => o.status === 'cancelled').length,
      totalSales,
      cashTotal,
      vodafoneTotal,
      instapayTotal,
    };
  }, [shiftOrders]);

  // Filtered Shift Orders
  const filteredShiftOrders = useMemo(() => {
    return shiftOrders.filter((o) => {
      if (ordersFilterType !== 'all' && o.orderType !== ordersFilterType) {
        return false;
      }
      if (ordersSearch.trim()) {
        const q = ordersSearch.trim().toLowerCase();
        const numMatch = o.orderNumber.toLowerCase().includes(q);
        const nameMatch = o.customerName?.toLowerCase().includes(q);
        const phoneMatch = o.customerPhone?.toLowerCase().includes(q);
        const itemMatch = o.items.some((it) => it.name.toLowerCase().includes(q));
        if (!numMatch && !nameMatch && !phoneMatch && !itemMatch) return false;
      }
      return true;
    });
  }, [shiftOrders, ordersFilterType, ordersSearch]);

  return (
    <div
      className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-['Cairo',sans-serif] selection:bg-[#D92D16] selection:text-white"
      dir="rtl"
    >
      {/* =========================================================================
          TOAST NOTIFICATION
          ========================================================================= */}
      {toast && (
        <div className="fixed bottom-6 start-6 z-50 animate-bounce duration-300 print:hidden">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold text-white ${
              toast.type === 'error'
                ? 'bg-[#D92D16] border-[#FF5A1F]'
                : toast.type === 'info'
                ? 'bg-[#1C1C21] border-[#FF5A1F]'
                : 'bg-[#141417] border-emerald-500'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-white" />
            ) : toast.type === 'info' ? (
              <Flame className="w-4 h-4 text-[#FF5A1F]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOP BAR (HEADER)
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#141417]/95 backdrop-blur-md border-b border-[#27272A] px-3 sm:px-6 py-2.5 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Title & Shift Date */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#09090B] border border-[#27272A] p-1 flex items-center justify-center shadow-inner flex-shrink-0">
              <img
                src="/images/logo/fire-ash-logo.webp"
                alt="FIRE & ASH"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                  كاشير FIRE &amp; ASH
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D92D16]/20 text-[#FF5A1F] border border-[#D92D16]/30">
                  <Flame className="w-3 h-3" />
                  وردية {currentBusinessDate}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#A1A1AA]">
                <span className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> متصل
                    </span>
                  ) : (
                    <span className="text-[#FFB020] flex items-center gap-1">
                      <WifiOff className="w-3 h-3" /> وضع غير متصل (تزامن تلقائي)
                    </span>
                  )}
                </span>
                <span>•</span>
                <span>
                  {currentUser?.email ? (
                    isManager(currentUser) ? (
                      <span className="text-[#FF5A1F] font-bold">المدير ({currentUser.email})</span>
                    ) : (
                      <span className="text-white font-medium">كاشير ({currentUser.email.split('@')[0]})</span>
                    )
                  ) : (
                    'كاشير'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation & Action Controls */}
          <div className="flex items-center gap-2">
            {/* View Switcher: POS vs Orders */}
            <div className="flex items-center bg-[#09090B] p-1 rounded-xl border border-[#27272A]">
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pos'
                    ? 'bg-[#D92D16] text-white shadow-md shadow-[#D92D16]/20'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>نقطة البيع</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-[#D92D16] text-white shadow-md shadow-[#D92D16]/20'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>أوردرات الوردية</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#1C1C21] text-[10px] font-mono font-bold text-[#FF5A1F]">
                  {shiftMetrics.totalCount}
                </span>
              </button>
            </div>

            {/* Customer CRM Modal Button */}
            <button
              type="button"
              onClick={() => setIsCrmModalOpen(true)}
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-white transition-colors cursor-pointer"
              title="عرض وتعديل قاعدة بيانات العملاء"
            >
              <Users className="w-3.5 h-3.5 text-[#FFB020]" />
              <span className="hidden md:inline">قاعدة العملاء</span>
            </button>

            {/* Manager Dashboard Button (ONLY VISIBLE TO MANAGER) */}
            {isManager(currentUser) && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] text-xs font-bold text-white transition-colors cursor-pointer"
                title="الانتقال إلى لوحة المدير الرئيسية"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">لوحة المدير</span>
              </Link>
            )}

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 py-2 px-2.5 sm:px-3 rounded-xl bg-[#09090B] hover:bg-[#1C1C21] border border-[#27272A] text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D92D16]" />
              <span className="hidden lg:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MAIN WORKSPACE CONTENT
          ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 print:hidden">
        {activeTab === 'pos' ? (
          /* =====================================================================
             TAB 1: POS WORKSPACE (MENU PANEL + ACTIVE TICKET PANEL)
             ===================================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT / DESKTOP RIGHT (COL 1-7): MENU ITEMS PANEL */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-3">
              {/* Search & Category Filter Pills */}
              <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-3 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن صنف بالاسم أو الوصف (مثلاً: كفتة، شيش، ربع)..."
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-white placeholder-[#52525B] outline-none transition-colors"
                  />
                  <Search className="w-4 h-4 text-[#71717A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CATEGORY_TABS.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/20'
                            : 'bg-[#1C1C21] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {menuLoading ? (
                  <div className="col-span-full py-16 text-center text-[#A1A1AA] space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF5A1F]" />
                    <span className="text-xs">جاري تحميل قائمة الطعام...</span>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[#71717A] space-y-2 bg-[#141417] rounded-2xl border border-[#27272A]">
                    <UtensilsCrossed className="w-8 h-8 mx-auto text-[#27272A]" />
                    <p className="text-xs">لا توجد أصناف مطابقة للبحث</p>
                  </div>
                ) : (
                  filteredMenuItems.map((item) => {
                    const isWeighted = item.categoryId === 'weights' || (item.weights && item.weights.length > 0);
                    const isOutOfStock = item.isAvailable === false;

                    return (
                      <div
                        key={item.id}
                        className={`bg-[#141417] border rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-150 ${
                          isOutOfStock
                            ? 'opacity-40 border-[#27272A] pointer-events-none'
                            : 'border-[#27272A] hover:border-[#FF5A1F]/50 shadow-sm hover:shadow-lg hover:shadow-black/60'
                        }`}
                      >
                        <div>
                          {/* Image & Badge */}
                          <div className="relative w-full h-20 sm:h-24 rounded-xl overflow-hidden bg-[#09090B] mb-2 border border-[#27272A]">
                            <img
                              src={item.imageUrl || item.image || '/images/dishes/sandwich-kofta.webp'}
                              alt={item.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            {item.badge && (
                              <span className="absolute top-1.5 start-1.5 bg-[#D92D16] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                {item.badge}
                              </span>
                            )}
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-[10px] font-bold text-red-400">
                                غير متاح
                              </div>
                            )}
                          </div>

                          {/* Item Name & Base Price */}
                          <h4 className="text-xs sm:text-sm font-bold text-white leading-tight line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-[11px] font-bold text-[#FF5A1F] block mt-0.5 font-mono">
                            {isWeighted ? 'حسب الوزن' : `${item.price} ج.م`}
                          </span>
                        </div>

                        {/* Order Actions */}
                        <div className="mt-2.5 pt-2 border-t border-[#1C1C21]">
                          {isWeighted && item.weights && item.weights.length > 0 ? (
                            /* Inline 1-Tap Weight Buttons for zero-friction ordering */
                            <div className="grid grid-cols-2 gap-1">
                              {item.weights.map((w) => (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => addItemToTicket(item, w)}
                                  className="px-1.5 py-1 rounded-lg bg-[#1C1C21] hover:bg-[#FF5A1F] hover:text-white border border-[#27272A] text-[10px] font-bold text-[#FAFAFA] transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                                  title={`إضافة ${w.label} بسعر ${w.price} ج.م`}
                                >
                                  <span className="truncate w-full text-center">{w.label}</span>
                                  <span className="font-mono text-[9px] text-[#A1A1AA] hover:text-white">
                                    {w.price}ج
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            /* Standard 1-Tap Add Button */
                            <button
                              type="button"
                              onClick={() => addItemToTicket(item)}
                              className="w-full py-1.5 px-2 rounded-xl bg-[#1C1C21] hover:bg-[#D92D16] text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#FF5A1F]" />
                              <span>إضافة للطلب</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT / DESKTOP LEFT (COL 8-12): ACTIVE ORDER TICKET PANEL */}
            <div className="lg:col-span-5 xl:col-span-5 bg-[#141417] border border-[#27272A] rounded-2xl p-4 flex flex-col space-y-4 shadow-xl">
              {/* Ticket Header & Mode Indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FF5A1F]/20 text-[#FF5A1F] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      {editingOrder ? `تعديل أوردر (${editingOrder.orderNumber})` : 'أوردر جديد'}
                    </h3>
                    <span className="text-[10px] text-[#71717A]">
                      {ticketItems.length} أصناف في الفاتورة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={resetTicket}
                    className="p-1.5 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#D92D16] transition-colors cursor-pointer"
                    title="إفراغ السلة وبدء أوردر جديد"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#A1A1AA] mb-1.5">
                  نوع الطلب
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#09090B] p-1 rounded-xl border border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      orderType === 'takeaway'
                        ? 'bg-[#FF5A1F] text-white shadow'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    تيك أواي
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('dine_in')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      orderType === 'dine_in'
                        ? 'bg-[#FF5A1F] text-white shadow'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    صالة
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      orderType === 'delivery'
                        ? 'bg-[#FF5A1F] text-white shadow'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    دليفري
                  </button>
                </div>

                {/* Table Number (If Dine-in) */}
                {orderType === 'dine_in' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-[#A1A1AA]">رقم الطاولة:</span>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="طاولة 1، 2، VIP..."
                      className="flex-1 bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-lg py-1 px-2.5 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Customer CRM Block (Phone Lookup, Name, Addresses) */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#A1A1AA] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#FF5A1F]" />
                    <span>بيانات العميل (CRM الذكي)</span>
                  </span>
                  {isLookingUpCustomer && (
                    <span className="text-[10px] text-[#FF5A1F] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> جاري البحث...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Phone Input */}
                  <div>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="رقم الهاتف (01xxxxxxxxx)"
                      className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-[#52525B] font-mono outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* Name Input */}
                  <div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="اسم العميل (اختياري)"
                      className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-[#52525B] outline-none"
                    />
                  </div>
                </div>

                {/* Returning Customer Badge */}
                {crmRecord && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span className="font-bold">عميل سابق — {crmRecord.ordersCount} طلبات</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      إجمالي {crmRecord.totalSpent.toLocaleString()} ج.م
                    </span>
                  </div>
                )}

                {/* Delivery Address (if Delivery or Customer has saved addresses) */}
                {(orderType === 'delivery' || (crmRecord && crmRecord.addresses.length > 0)) && (
                  <div className="space-y-1.5 pt-1 border-t border-[#1C1C21]">
                    {/* Saved Frequent Address Chips */}
                    {crmRecord && crmRecord.addresses.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] text-[#71717A] w-full">العناوين المحفوظة:</span>
                        {crmRecord.addresses.map((addr, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => setDeliveryAddress(addr)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              deliveryAddress === addr
                                ? 'bg-[#FF5A1F] text-white'
                                : 'bg-[#1C1C21] text-[#A1A1AA] hover:text-white border border-[#27272A]'
                            }`}
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{addr}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="عنوان التوصيل بالتفصيل (الشارع، العمارة، الشقة)..."
                      className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] rounded-lg py-1.5 px-2.5 text-xs text-white placeholder-[#52525B] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Ticket Items List */}
              <div className="flex-1 max-h-64 overflow-y-auto space-y-2 pr-1">
                {ticketItems.length === 0 ? (
                  <div className="py-8 text-center text-[#52525B] space-y-1">
                    <ShoppingCart className="w-8 h-8 mx-auto text-[#27272A]" />
                    <p className="text-xs">السلة فارغة. اضغط على أي صنف لإضافته</p>
                  </div>
                ) : (
                  ticketItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#09090B] border border-[#27272A] rounded-xl p-2.5 space-y-2"
                    >
                      {/* Item Row: Name, Weight, Qty, Price, Remove */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {item.name}
                          </span>
                          {item.weightLabel && (
                            <span className="text-[10px] text-[#FF5A1F] font-semibold">
                              {item.weightLabel}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-[#141417] border border-[#27272A] rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(idx, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#A1A1AA] hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white px-1">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(idx, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#A1A1AA] hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-xs font-mono font-bold text-white w-14 text-left">
                          {item.totalPrice} ج
                        </span>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItemFromTicket(idx)}
                          className="text-[#52525B] hover:text-[#D92D16] p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 1-Tap Kitchen Notes per item */}
                      <div className="pt-1 border-t border-[#1C1C21] space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {QUICK_KITCHEN_CHIPS.map((chip) => {
                            const isSelected = item.kitchenNotes.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => toggleKitchenNote(idx, chip)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#D92D16] text-white'
                                    : 'bg-[#1C1C21] text-[#71717A] hover:text-white'
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>

                        <input
                          type="text"
                          value={item.customNote || ''}
                          onChange={(e) => setCustomKitchenNote(idx, e.target.value)}
                          placeholder="ملاحظة مطبخ مخصصة..."
                          className="w-full bg-[#141417] border border-[#27272A] rounded py-0.5 px-2 text-[10px] text-white placeholder-[#52525B] outline-none"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* General Order Notes */}
              <div>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="ملاحظات عامة على الأوردر..."
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-xl py-1.5 px-3 text-xs text-white placeholder-[#52525B] outline-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#A1A1AA] mb-1">
                  طريقة الدفع
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#09090B] p-1 rounded-xl border border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>كاش</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('vodafone_cash')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentMethod === 'vodafone_cash'
                        ? 'bg-[#D92D16] text-white shadow'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>فودافون</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instapay')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentMethod === 'instapay'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>إنستاباي</span>
                  </button>
                </div>
              </div>

              {/* Financial Inputs & Summary */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 space-y-2 text-xs">
                {/* Subtotal */}
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono text-white font-bold">{subtotal} ج.م</span>
                </div>

                {/* Delivery Fee Input */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#A1A1AA]">رسوم التوصيل:</span>
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      min="0"
                      value={deliveryFee || ''}
                      onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-[#141417] border border-[#27272A] rounded-lg py-1 px-2 text-xs text-white font-mono text-left outline-none"
                    />
                    <span className="text-[10px] text-[#71717A]">ج</span>
                  </div>
                </div>

                {/* Discount Input */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#A1A1AA]">خصم:</span>
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      min="0"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-[#141417] border border-[#27272A] rounded-lg py-1 px-2 text-xs text-white font-mono text-left outline-none"
                    />
                    <span className="text-[10px] text-[#71717A]">ج</span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="pt-2 border-t border-[#1C1C21] flex justify-between items-center">
                  <span className="text-sm font-black text-white">الإجمالي النهائي:</span>
                  <span className="text-xl font-black text-[#FF5A1F] font-mono">
                    {finalTotal} ج.م
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* Primary Button: Save & Print Both Receipts */}
                <button
                  type="button"
                  disabled={isSaving || ticketItems.length === 0}
                  onClick={() => handleSaveOrder('both')}
                  className="w-full py-3 px-4 rounded-xl bg-[#D92D16] hover:bg-[#FF5A1F] active:bg-[#B91C1C] disabled:opacity-40 text-white font-black text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#D92D16]/25 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري حفظ الأوردر...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>حفظ وطباعة الريسيتين (مطبخ + عميل)</span>
                    </>
                  )}
                </button>

                {/* Secondary Print Actions */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={isSaving || ticketItems.length === 0}
                    onClick={() => handleSaveOrder('kitchen')}
                    className="py-2 px-1.5 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] disabled:opacity-40 text-[11px] font-bold text-[#FAFAFA] transition-colors cursor-pointer text-center"
                    title="حفظ وطباعة بون المطبخ فقط"
                  >
                    بون مطبخ فقط
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || ticketItems.length === 0}
                    onClick={() => handleSaveOrder('customer')}
                    className="py-2 px-1.5 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] disabled:opacity-40 text-[11px] font-bold text-[#FAFAFA] transition-colors cursor-pointer text-center"
                    title="حفظ وطباعة فاتورة العميل فقط"
                  >
                    فاتورة عميل فقط
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || ticketItems.length === 0}
                    onClick={() => handleSaveOrder(undefined)}
                    className="py-2 px-1.5 rounded-xl bg-[#09090B] hover:bg-[#1C1C21] border border-[#27272A] disabled:opacity-40 text-[11px] font-bold text-[#A1A1AA] hover:text-white transition-colors cursor-pointer text-center"
                    title="حفظ في قاعدة البيانات بدون طباعة"
                  >
                    حفظ فقط
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
             TAB 2: TODAY'S SHIFT ORDERS (أوردرات الوردية)
             ===================================================================== */
          <div className="space-y-4">
            {/* Shift Summary Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-[#71717A] block">أوردرات الوردية</span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {shiftMetrics.totalCount}
                </span>
                <span className="text-[10px] text-[#52525B] block mt-0.5">
                  ({shiftMetrics.cancelledCount} ملغي)
                </span>
              </div>

              <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-[#71717A] block">إجمالي مبيعات الوردية</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {shiftMetrics.totalSales.toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-[#71717A] block">مبيعات الكاش (نقدي)</span>
                <span className="text-lg sm:text-xl font-bold text-white font-mono">
                  {shiftMetrics.cashTotal.toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-[#71717A] block">فودافون كاش + إنستاباي</span>
                <span className="text-lg sm:text-xl font-bold text-[#FF5A1F] font-mono">
                  {(shiftMetrics.vodafoneTotal + shiftMetrics.instapayTotal).toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* Filter and Search Bar for Orders */}
            <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  placeholder="ابحث برقم الأوردر أو اسم العميل أو الهاتف..."
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl py-2 pr-9 pl-3 text-xs text-white placeholder-[#52525B] outline-none"
                />
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Order Type Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#09090B] p-1 rounded-xl border border-[#27272A] w-full sm:w-auto">
                {(['all', 'takeaway', 'dine_in', 'delivery'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrdersFilterType(t)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex-1 sm:flex-initial text-center ${
                      ordersFilterType === t
                        ? 'bg-[#FF5A1F] text-white'
                        : 'text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {t === 'all'
                      ? 'الكل'
                      : t === 'takeaway'
                      ? 'تيك أواي'
                      : t === 'dine_in'
                      ? 'صالة'
                      : 'دليفري'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-2.5">
              {ordersLoading ? (
                <div className="py-16 text-center text-[#A1A1AA] space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF5A1F]" />
                  <span className="text-xs">جاري تحميل أوردرات الوردية الحالية...</span>
                </div>
              ) : filteredShiftOrders.length === 0 ? (
                <div className="py-16 text-center text-[#71717A] space-y-2 bg-[#141417] rounded-2xl border border-[#27272A]">
                  <FileText className="w-8 h-8 mx-auto text-[#27272A]" />
                  <p className="text-xs">لا توجد أوردرات مسجلة في هذه الوردية بعد</p>
                </div>
              ) : (
                filteredShiftOrders.map((ord) => {
                  const isCancelled = ord.status === 'cancelled';
                  const timeFormatted = ord.createdAt?.toDate
                    ? formatCairoTime(ord.createdAt.toDate())
                    : formatCairoTime();

                  return (
                    <div
                      key={ord.id}
                      className={`bg-[#141417] border rounded-2xl p-4 transition-all space-y-3 ${
                        isCancelled
                          ? 'border-red-950/40 opacity-50 bg-[#120a0a]'
                          : 'border-[#27272A] hover:border-[#3F3F46]'
                      }`}
                    >
                      {/* Top Row: Order #, Time, Type, Status, Total */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C1C21] pb-2.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-black text-white font-mono">
                            {ord.orderNumber}
                          </span>
                          <span className="text-xs text-[#71717A] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{timeFormatted}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#27272A] text-[11px] font-bold text-white">
                            {ord.orderType === 'dine_in'
                              ? `صالة ${ord.tableNumber ? `(طاولة ${ord.tableNumber})` : ''}`
                              : ord.orderType === 'delivery'
                              ? 'دليفري'
                              : 'تيك أواي'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isCancelled
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {isCancelled ? 'ملغي' : 'مكتمل'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#1C1C21] text-[10px] text-[#A1A1AA]">
                            {ord.paymentMethod === 'cash'
                              ? 'كاش'
                              : ord.paymentMethod === 'vodafone_cash'
                              ? 'فودافون كاش'
                              : 'إنستاباي'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black text-[#FF5A1F] font-mono">
                            {ord.finalTotal} ج.م
                          </span>
                        </div>
                      </div>

                      {/* Customer Row (if present) */}
                      {(ord.customerPhone || ord.customerName || ord.deliveryAddress) && (
                        <div className="text-xs text-[#A1A1AA] flex flex-wrap gap-x-4 gap-y-1">
                          {ord.customerName && (
                            <span>العميل: <strong className="text-white">{ord.customerName}</strong></span>
                          )}
                          {ord.customerPhone && (
                            <span className="font-mono">الهاتف: {ord.customerPhone}</span>
                          )}
                          {ord.deliveryAddress && (
                            <span>العنوان: {ord.deliveryAddress}</span>
                          )}
                        </div>
                      )}

                      {/* Items Row */}
                      <div className="text-xs text-[#D4D4D8] space-y-1 pt-1">
                        <div className="flex flex-wrap gap-2">
                          {ord.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-[#09090B] border border-[#27272A] text-[11px]"
                            >
                              <strong className="text-white">{it.quantity}×</strong> {it.name}{' '}
                              {it.weightLabel ? `(${it.weightLabel})` : ''}
                              {(it.kitchenNotes?.length > 0 || it.customNote) && (
                                <span className="text-[#FF5A1F] mr-1">
                                  [{it.kitchenNotes?.join('، ')} {it.customNote ? it.customNote : ''}]
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions: Edit, Cancel, Re-Print */}
                      <div className="pt-2 border-t border-[#1C1C21] flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-[#52525B]">
                          الكاشير: {ord.createdByName || ord.createdBy}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Re-Print Controls */}
                          <button
                            type="button"
                            onClick={() => triggerPrintForOrder(ord, 'both')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
                            title="إعادة طباعة الريسيتين"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#FF5A1F]" />
                            <span>طباعة</span>
                          </button>

                          {/* Edit (only if not cancelled) */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => loadOrderForEditing(ord)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
                              title="تعديل تفاصيل الأوردر في السلة"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                              <span>تعديل</span>
                            </button>
                          )}

                          {/* Cancel Order */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(ord)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs font-bold text-red-400 transition-colors cursor-pointer flex items-center gap-1"
                              title="إلغاء الأوردر وخصمه من الوردية"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>إلغاء</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          SMART CUSTOMER CRM MODAL
          ========================================================================= */}
      <CustomerCRMModal
        isOpen={isCrmModalOpen}
        onClose={() => setIsCrmModalOpen(false)}
        onSelectCustomer={handleSelectCustomerFromCRM}
        db={db}
      />

      {/* =========================================================================
          DUAL THERMAL RECEIPT PRINTER COMPONENT (80mm Target)
          ========================================================================= */}
      <ReceiptPrinter
        order={printOrder}
        mode={printMode}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
