import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, Bike, Store, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalPrice,
    totalCount,
    orderForm,
    updateOrderField,
    sendWhatsAppOrder,
  } = useCart();

  const [formError, setFormError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  // Real-time phone check
  const phoneClean = orderForm.customerPhone.trim().replace(/\s+/g, '');
  const isPhoneValid = /^01[0125][0-9]{8}$/.test(phoneClean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = sendWhatsAppOrder();
    if (!result.success && result.error) {
      setFormError(result.error);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        />

        {/* Drawer Panel — slides in from right in RTL */}
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <motion.div
            initial={shouldReduceMotion ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-screen max-w-md bg-[#141417] border-s border-[#27272A] shadow-2xl flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#27272A] flex items-center justify-between bg-[#09090B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D92D16]/10 border border-[#D92D16]/30 flex items-center justify-center text-[#FF5A1F]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">سلة الطلبات</h2>
                  <span className="text-xs text-[#A1A1AA]">
                    {totalCount} {totalCount === 1 ? 'صنف مختار' : 'أصناف مختارة'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-2 rounded-lg text-[#71717A] hover:text-[#D92D16] hover:bg-[#1C1C21] transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="إفراغ السلة"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">إفراغ</span>
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#1C1C21] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#1C1C21] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-4">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">السلة فاضية</h3>
                <p className="text-xs text-[#A1A1AA] max-w-xs mb-6">
                  السلة فاضية — ابدأ طلبك من المنيو.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="py-2.5 px-6 rounded-xl bg-[#D92D16] hover:bg-[#FF5A1F] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  تصفح المنيو الآن
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                {/* Cart Items List */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {cart.map((item) => (
                      <motion.div
                        key={item.cartItemId}
                        layout
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 flex gap-3 items-start">
                          {/* Thumbnail */}
                          <img
                            src={item.menuItem.image}
                            alt={item.menuItem.name}
                            className="w-16 h-16 rounded-lg object-cover bg-[#1C1C21] flex-shrink-0"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {item.menuItem.name}
                              </h4>
                              <button
                                onClick={() => removeFromCart(item.cartItemId)}
                                className="text-[#71717A] hover:text-[#D92D16] p-1 transition-colors cursor-pointer"
                                title="حذف من السلة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Weight if any */}
                            {item.selectedWeight && (
                              <span className="inline-block text-[11px] font-semibold text-[#FF5A1F] bg-[#D92D16]/10 px-2 py-0.5 rounded mt-0.5">
                                الوزن: {item.selectedWeight.label}
                              </span>
                            )}

                            {/* Add-ons list if any */}
                            {item.selectedAddOns.length > 0 && (
                              <div className="text-[10px] text-[#A1A1AA] mt-1 space-x-1 space-x-reverse">
                                <span className="text-[#FFB020]">إضافات:</span>
                                {item.selectedAddOns.map((a) => (
                                  <span key={a.id} className="bg-[#1C1C21] px-1.5 py-0.5 rounded text-[#FAFAFA]">
                                    {a.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Notes if any */}
                            {item.notes && (
                              <p className="text-[10px] text-[#A1A1AA] italic mt-1 bg-[#141417] px-2 py-0.5 rounded">
                                ملاحظة: {item.notes}
                              </p>
                            )}

                            {/* Price & Stepper Row */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#1C1C21]">
                              <div className="flex items-center gap-1.5 font-['Oswald'] tabular-nums">
                                <span className="text-sm font-black text-white">{item.totalPrice}</span>
                                <span className="text-[10px] font-bold text-[#FF5A1F]">ج.م</span>
                              </div>

                              <div className="flex items-center gap-1.5 bg-[#141417] border border-[#27272A] rounded-lg p-0.5">
                                <button
                                  onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                  className="w-6 h-6 rounded bg-[#1C1C21] hover:bg-[#27272A] text-white flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-5 text-center text-xs font-bold text-white font-['Oswald'] tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                  className="w-6 h-6 rounded bg-[#1C1C21] hover:bg-[#27272A] text-white flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Checkout Details Form */}
                <form onSubmit={handleSubmit} className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 space-y-3.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1C1C21] pb-2">
                    <span>بيانات تسليم الطلب:</span>
                  </h4>

                  {/* Order Type Toggle */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#141417] rounded-xl border border-[#27272A]">
                    <button
                      type="button"
                      onClick={() => updateOrderField('orderType', 'delivery')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        orderForm.orderType === 'delivery'
                          ? 'bg-[#D92D16] text-white shadow'
                          : 'text-[#A1A1AA] hover:text-white'
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>توصيل للمنزل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOrderField('orderType', 'pickup')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        orderForm.orderType === 'pickup'
                          ? 'bg-[#D92D16] text-white shadow'
                          : 'text-[#A1A1AA] hover:text-white'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>استلام من الفرع</span>
                    </button>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="text-[11px] font-bold text-[#A1A1AA] block mb-1">
                      اسم العميل <span className="text-[#D92D16]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={orderForm.customerName}
                      onChange={(e) => updateOrderField('customerName', e.target.value)}
                      placeholder="باسم مين الطلب؟"
                      className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none"
                    />
                  </div>

                  {/* Customer Phone (Egyptian regex validation) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-[#A1A1AA]">
                        رقم الهاتف (واتساب) <span className="text-[#D92D16]">*</span>
                      </label>
                      {phoneClean && (
                        <span className={`text-[10px] flex items-center gap-1 ${isPhoneValid ? 'text-emerald-400' : 'text-[#FF5A1F]'}`}>
                          {isPhoneValid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              رقم مصري صحيح
                            </>
                          ) : (
                            '11 رقماً تبدأ بـ 01'
                          )}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={orderForm.customerPhone}
                      onChange={(e) => updateOrderField('customerPhone', e.target.value)}
                      placeholder="01120774455"
                      className={`w-full bg-[#141417] border rounded-xl px-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none font-mono ${
                        phoneClean && !isPhoneValid
                          ? 'border-[#D92D16] focus:border-[#D92D16]'
                          : 'border-[#27272A] focus:border-[#FF5A1F]'
                      }`}
                    />
                  </div>

                  {/* Delivery Address (if Delivery) */}
                  {orderForm.orderType === 'delivery' && (
                    <div>
                      <label className="text-[11px] font-bold text-[#A1A1AA] block mb-1">
                        عنوان التوصيل بالتفصيل (البدرشين) <span className="text-[#D92D16]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={orderForm.deliveryAddress}
                        onChange={(e) => updateOrderField('deliveryAddress', e.target.value)}
                        placeholder="البدرشين، اسم الشارع، رقم العمارة، علامة مميزة"
                        className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* General Notes */}
                  <div>
                    <label className="text-[11px] font-bold text-[#A1A1AA] block mb-1">
                      ملاحظات عامة على الطلب (اختياري)
                    </label>
                    <input
                      type="text"
                      value={orderForm.notes}
                      onChange={(e) => updateOrderField('notes', e.target.value)}
                      placeholder="مثال: رن الجرس بدلاً من الاتصال، فكة من 200..."
                      className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none"
                    />
                  </div>

                  {/* Validation Error Banner */}
                  {formError && (
                    <div className="p-2.5 rounded-lg bg-[#D92D16]/15 border border-[#D92D16]/40 text-xs text-[#FF5A1F] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Footer Bill & WhatsApp Action */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-[#27272A] bg-[#09090B]">
                {/* Summary Rows */}
                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="flex justify-between text-[#A1A1AA]">
                    <span>إجمالي الأصناف:</span>
                    <span className="font-['Oswald'] tabular-nums text-white">{totalPrice} ج.م</span>
                  </div>
                  {orderForm.orderType === 'delivery' && (
                    <div className="flex justify-between text-[#A1A1AA]">
                      <span>خدمة التوصيل:</span>
                      <span className="text-[#FFB020]">بحسب المنطقة بالبدرشين</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-[#1C1C21]">
                    <span>الإجمالي:</span>
                    <div className="flex items-baseline gap-1 font-['Oswald'] tabular-nums text-[#FF5A1F]">
                      <span className="text-xl">{totalPrice}</span>
                      <span className="text-xs font-bold">ج.م</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Submit Button */}
                <button
                  onClick={handleSubmit}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer active:scale-98"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>إرسال الطلب عبر واتساب (01120774455)</span>
                </button>

                <p className="text-[11px] text-[#71717A] text-center mt-2">
                  سيتم فتح تطبيق واتساب برسالة جاهزة ومنسقة بجميع تفاصيل طلبك لتأكيده فوراً.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
