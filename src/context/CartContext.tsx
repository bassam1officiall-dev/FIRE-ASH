import React, { createContext, useContext, useState, useEffect, type ReactNode, useMemo } from 'react';
import type { MenuItem, WeightOption, AddOnOption, CartItem, OrderFormState } from '../types/menu';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    item: MenuItem,
    selectedWeight?: WeightOption,
    selectedAddOns?: AddOnOption[],
    notes?: string,
    quantity?: number
  ) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;

  // Modals & Drawers
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeItemModal: MenuItem | null;
  setActiveItemModal: (item: MenuItem | null) => void;
  showOriginalMenuModal: boolean;
  setShowOriginalMenuModal: (show: boolean) => void;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;

  // Checkout Form State
  orderForm: OrderFormState;
  setOrderForm: React.Dispatch<React.SetStateAction<OrderFormState>>;
  updateOrderField: <K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) => void;
  sendWhatsAppOrder: () => { success: boolean; error?: string };
}

const STORAGE_KEY = 'fire_ash_cart_v1';
const FORM_STORAGE_KEY = 'fire_ash_order_form_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load Cart from LocalStorage safely
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
    }
    return [];
  });

  // Load Order Form from LocalStorage safely
  const [orderForm, setOrderForm] = useState<OrderFormState>(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            orderType: parsed.orderType === 'pickup' ? 'pickup' : 'delivery',
            customerName: parsed.customerName || '',
            customerPhone: parsed.customerPhone || '',
            deliveryAddress: parsed.deliveryAddress || '',
            notes: parsed.notes || '',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load order form from localStorage:', e);
    }
    return {
      orderType: 'delivery',
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      notes: '',
    };
  });

  // Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeItemModal, setActiveItemModal] = useState<MenuItem | null>(null);
  const [showOriginalMenuModal, setShowOriginalMenuModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to persist cart to localStorage:', e);
    }
  }, [cart]);

  // Sync order form to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(orderForm));
    } catch (e) {
      console.warn('Failed to persist order form to localStorage:', e);
    }
  }, [orderForm]);

  const updateOrderField = <K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) => {
    setOrderForm((prev) => ({ ...prev, [key]: value }));
  };

  const addToCart = (
    item: MenuItem,
    selectedWeight?: WeightOption,
    selectedAddOns: AddOnOption[] = [],
    notes: string = '',
    quantity: number = 1
  ) => {
    if (quantity <= 0) return;

    // Calculate item unit price
    const basePrice = selectedWeight ? selectedWeight.price : item.price;
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = basePrice + addOnsTotal;

    // Generate deterministic cart item id
    const addOnsKey = selectedAddOns.map((a) => a.id).sort().join('_');
    const weightKey = selectedWeight ? selectedWeight.id : 'default';
    const notesKey = notes.trim().toLowerCase();
    const cartItemId = `${item.id}-${weightKey}-${addOnsKey}-${notesKey}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const next = [...prev];
        const existing = next[existingIndex];
        const newQty = existing.quantity + quantity;
        next[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: newQty * existing.unitPrice,
        };
        return next;
      } else {
        const newItem: CartItem = {
          cartItemId,
          menuItem: item,
          selectedWeight,
          selectedAddOns,
          notes: notes.trim(),
          quantity,
          unitPrice,
          totalPrice: unitPrice * quantity,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  // Format and send WhatsApp order
  const sendWhatsAppOrder = (): { success: boolean; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'السلة فارغة، يرجى إضافة أصناف أولاً.' };
    }

    if (!orderForm.customerName.trim()) {
      return { success: false, error: 'يرجى كتابة الاسم لتسجيل الطلب.' };
    }

    // Egyptian phone validation: starts with 01 and 11 digits total
    const phoneRegex = /^01[0125][0-9]{8}$/;
    const cleanPhone = orderForm.customerPhone.trim().replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return { success: false, error: 'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً (مثال: 01120774455).' };
    }

    if (orderForm.orderType === 'delivery' && !orderForm.deliveryAddress.trim()) {
      return { success: false, error: 'يرجى كتابة عنوان التوصيل بالتفصيل داخل البدرشين.' };
    }

    // Build the formatted Arabic WhatsApp Message
    const orderTypeLabel = orderForm.orderType === 'delivery' ? '🛵 توصيل للمنزل' : '🏪 استلام من الفرع';

    let msg = `🔥 *طلب جديد من المنيو الديجيتال — FIRE & ASH*\n`;
    msg += `-----------------------------------\n`;
    msg += `نوع الطلب: *${orderTypeLabel}*\n`;
    msg += `اسم العميل: *${orderForm.customerName.trim()}*\n`;
    msg += `رقم الهاتف: *${cleanPhone}*\n`;

    if (orderForm.orderType === 'delivery') {
      msg += `العنوان: *${orderForm.deliveryAddress.trim()}*\n`;
    }

    if (orderForm.notes.trim()) {
      msg += `ملاحظات عامة: _${orderForm.notes.trim()}_\n`;
    }

    msg += `-----------------------------------\n`;
    msg += `*تفاصيل الأصناف والطلب:*\n\n`;

    cart.forEach((item, idx) => {
      const weightText = item.selectedWeight ? ` (${item.selectedWeight.label})` : '';
      msg += `${idx + 1}. *${item.menuItem.name}${weightText}* × ${item.quantity}\n`;
      msg += `   السعر: ${item.totalPrice} ج.م\n`;

      if (item.selectedAddOns.length > 0) {
        msg += `   الإضافات: ${item.selectedAddOns.map((a) => `${a.name} (+${a.price} ج)`).join(' + ')}\n`;
      }

      if (item.notes) {
        msg += `   ملاحظة: _${item.notes}_\n`;
      }
      msg += `\n`;
    });

    msg += `-----------------------------------\n`;
    msg += `*إجمالي الطلب:* *${totalPrice} ج.م*\n`;
    if (orderForm.orderType === 'delivery') {
      msg += `_(يُضاف سعر التوصيل بحسب المنطقة في البدرشين)_\n`;
    }
    msg += `-----------------------------------\n`;
    msg += `شكراً لاختياركم FIRE & ASH — TASTE THE FLAME 🔥\n`;
    msg += `البدرشين، أول طريق أبو ربع، بجوار مسجد شكري لبنة`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://wa.me/201120774455?text=${encoded}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    return { success: true };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
        activeItemModal,
        setActiveItemModal,
        showOriginalMenuModal,
        setShowOriginalMenuModal,
        showLocationModal,
        setShowLocationModal,
        orderForm,
        setOrderForm,
        updateOrderField,
        sendWhatsAppOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
