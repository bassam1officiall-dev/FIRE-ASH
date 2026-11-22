import React from 'react';
import type { POSOrder } from '../../types/pos';
import { formatCairoDateTime } from '../../utils/businessDate';
import { RESTAURANT_INFO } from '../../data/menuData';
import { Printer, X, Utensils, ReceiptText } from 'lucide-react';

export type PrintMode = 'both' | 'kitchen' | 'customer';

interface ReceiptPrinterProps {
  order: POSOrder | null;
  mode: PrintMode;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: (mode: PrintMode) => void;
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  order,
  mode,
  isOpen,
  onClose,
  onPrint,
}) => {
  const orderTimeStr = React.useMemo(() => {
    if (!order) return '';
    if (order.createdAt?.toDate) {
      return formatCairoDateTime(order.createdAt.toDate());
    }
    if (order.createdAt instanceof Date) {
      return formatCairoDateTime(order.createdAt);
    }
    return formatCairoDateTime();
  }, [order]);

  if (!order) return null;

  const getOrderTypeLabel = () => {
    switch (order.orderType) {
      case 'dine_in':
        return order.tableNumber ? `صالة (طاولة ${order.tableNumber})` : 'صالة داخلية';
      case 'delivery':
        return 'دليفري (توصيل منزلي)';
      case 'takeaway':
      default:
        return 'تيك أواي (استلام من الفرع)';
    }
  };

  const getPaymentMethodLabel = () => {
    switch (order.paymentMethod) {
      case 'cash':
        return 'كاش (نقدي)';
      case 'vodafone_cash':
        return 'فودافون كاش (Vodafone Cash)';
      case 'instapay':
        return 'إنستاباي (InstaPay)';
      default:
        return 'كاش';
    }
  };

  const handleTriggerPrint = (selectedMode: PrintMode) => {
    if (onPrint) {
      onPrint(selectedMode);
    } else {
      window.print();
    }
  };

  return (
    <>
      {/* =========================================================================
          PRINTABLE THERMAL CONTAINER (80mm Target, Pure Black/White, RTL)
          ========================================================================= */}
      <div id="thermal-receipt-container" className="hidden print:block print:w-[80mm] print:text-black print:bg-white" dir="rtl">
        <style>{`
          @page {
            size: 80mm auto;
            margin: 0;
          }
          @media print {
            html, body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              color: #000 !important;
              font-family: 'Cairo', sans-serif !important;
            }
            body * {
              visibility: hidden;
            }
            #thermal-receipt-container, #thermal-receipt-container * {
              visibility: visible;
            }
            #thermal-receipt-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              padding: 3mm 2mm;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .print-page-break {
              page-break-after: always;
              break-after: page;
              height: 0;
              display: block;
              margin: 0;
              border: none;
            }
          }
        `}</style>

        {/* 1. KITCHEN TICKET (بون المطبخ) */}
        {(mode === 'both' || mode === 'kitchen') && (
          <div className="kitchen-ticket w-full text-black font-['Cairo'] pb-4">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <span className="text-base font-black tracking-wide block">
                بون مطبخ — FIRE &amp; ASH
              </span>
              <span className="text-2xl font-black block my-1">
                {order.orderNumber}
              </span>
              <div className="text-xs font-bold flex justify-between px-1">
                <span>{orderTimeStr}</span>
                <span className="bg-black text-white px-2 py-0.5 rounded text-[11px]">
                  {getOrderTypeLabel()}
                </span>
              </div>
            </div>

            {/* Items List (NO PRICES) */}
            <div className="space-y-2 pt-1 border-b-2 border-black pb-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="border-b border-dashed border-gray-400 pb-1.5 last:border-b-0">
                  <div className="flex items-start justify-between text-base font-extrabold leading-snug">
                    <span className="text-lg font-black ml-2 font-mono">
                      {item.quantity} ×
                    </span>
                    <span className="flex-1">
                      {item.name}
                      {item.weightLabel ? ` (${item.weightLabel})` : ''}
                    </span>
                  </div>

                  {/* Kitchen Notes */}
                  {(item.kitchenNotes?.length > 0 || item.customNote) && (
                    <div className="mt-1 mr-4 bg-gray-200 text-black px-2 py-0.5 rounded text-xs font-black inline-block">
                      {item.kitchenNotes?.join(' ، ')}
                      {item.customNote ? ` (${item.customNote})` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* General Order Notes */}
            {order.notes && (
              <div className="mt-2 p-1.5 border border-black rounded text-xs font-black">
                <span className="block underline">ملاحظات عامة:</span>
                <span>{order.notes}</span>
              </div>
            )}

            {/* Kitchen Footer */}
            <div className="text-center mt-3 text-[11px] font-bold">
              <span>*** نهاية بون المطبخ ***</span>
            </div>
          </div>
        )}

        {/* Page Break between Kitchen and Customer receipts */}
        {mode === 'both' && <div className="print-page-break my-4" />}

        {/* 2. CUSTOMER RECEIPT (فاتورة العميل) */}
        {(mode === 'both' || mode === 'customer') && (
          <div className="customer-receipt w-full text-black font-['Cairo'] pt-2 pb-6">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <h2 className="text-base font-black tracking-tight leading-tight">
                FIRE &amp; ASH — مشويات على الفحم
              </h2>
              <p className="text-[10px] font-bold text-gray-700">
                من البدرشين للبيوت — فحم حي وتتبيلة بمزاج
              </p>
              <p className="text-[10px] font-bold mt-0.5">
                العنوان: {RESTAURANT_INFO.address}
              </p>
              <p className="text-[11px] font-black tracking-wider mt-0.5 font-mono">
                هاتف الطلبات: {RESTAURANT_INFO.phoneDisplay}
              </p>
            </div>

            {/* Order Meta Info */}
            <div className="text-[11px] font-bold border-b border-black pb-1.5 mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span>رقم الطلب: <strong className="text-sm font-black">{order.orderNumber}</strong></span>
                <span>النوع: {getOrderTypeLabel()}</span>
              </div>
              <div className="flex justify-between">
                <span>التاريخ والوقت:</span>
                <span>{orderTimeStr}</span>
              </div>
              {order.createdByName && (
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>الكاشير:</span>
                  <span>{order.createdByName}</span>
                </div>
              )}
            </div>

            {/* Customer Details Block (especially for Delivery / saved CRM) */}
            {(order.customerPhone || order.customerName || order.deliveryAddress) && (
              <div className="bg-gray-100 p-1.5 rounded border border-gray-400 text-xs mb-2 space-y-0.5">
                {order.customerName && (
                  <div className="flex justify-between font-bold">
                    <span>العميل:</span>
                    <span>{order.customerName}</span>
                  </div>
                )}
                {order.customerPhone && (
                  <div className="flex justify-between font-bold font-mono">
                    <span>الهاتف:</span>
                    <span>{order.customerPhone}</span>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div className="text-[11px] font-bold pt-0.5 border-t border-gray-300">
                    <span className="block text-[10px] text-gray-600">عنوان التوصيل:</span>
                    <span>{order.deliveryAddress}</span>
                  </div>
                )}
              </div>
            )}

            {/* Itemized Table */}
            <table className="w-full text-xs font-bold mb-2 border-b border-black">
              <thead>
                <tr className="border-b border-black text-[10px] uppercase">
                  <th className="text-right py-1">الصنف</th>
                  <th className="text-center py-1 w-10">الكمية</th>
                  <th className="text-center py-1 w-12">السعر</th>
                  <th className="text-left py-1 w-14">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-300">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="align-top py-1">
                    <td className="py-1 text-right leading-tight">
                      <span>{item.name}</span>
                      {item.weightLabel && (
                        <span className="block text-[10px] text-gray-600 font-normal">
                          {item.weightLabel}
                        </span>
                      )}
                    </td>
                    <td className="py-1 text-center font-mono">{item.quantity}</td>
                    <td className="py-1 text-center font-mono">{item.price}</td>
                    <td className="py-1 text-left font-mono">{item.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div className="space-y-1 text-xs font-bold border-b-2 border-black pb-2 mb-2">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{order.subtotal} ج.م</span>
              </div>

              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>رسوم التوصيل:</span>
                  <span className="font-mono">+{order.deliveryFee} ج.م</span>
                </div>
              )}

              {order.discount > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>الخصم:</span>
                  <span className="font-mono">-{order.discount} ج.م</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black pt-1 border-t border-black">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-lg font-black">{order.finalTotal} ج.م</span>
              </div>

              <div className="flex justify-between text-[11px] pt-0.5 text-gray-700">
                <span>طريقة الدفع:</span>
                <span>{getPaymentMethodLabel()}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] font-bold text-gray-700 space-y-0.5 pt-1">
              <p className="text-xs font-black text-black">شكراً لزيارتكم — TASTE THE FLAME</p>
              <p>نعمل يومياً من 11:00 صباحاً حتى 03:30 فجراً</p>
              <p className="font-mono text-[9px] text-gray-500 pt-1">fire-ash-sooty.vercel.app</p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ON-SCREEN PREVIEW MODAL (CHARCOAL/EMBER THEME)
          ========================================================================= */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm print:hidden">
          <div
            className="w-full max-w-lg bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white font-['Cairo',sans-serif]"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#1C1C21]">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#FF5A1F]" />
                <h3 className="text-sm sm:text-base font-bold">
                  معاينة وطباعة الريسيت الحراري (80mm)
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] flex items-center justify-center text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Thermal Paper Emulation */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#09090B] flex justify-center">
              <div className="w-[80mm] max-w-full bg-white text-black p-4 rounded-lg shadow-lg font-['Cairo'] text-xs border border-gray-300">
                {/* Kitchen Preview */}
                {(mode === 'both' || mode === 'kitchen') && (
                  <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                    <div className="text-center border-b border-black pb-1 mb-2">
                      <span className="text-xs font-black block">بون مطبخ — FIRE &amp; ASH</span>
                      <span className="text-xl font-black block font-mono">{order.orderNumber}</span>
                      <div className="text-[10px] font-bold flex justify-between">
                        <span>{orderTimeStr}</span>
                        <span className="bg-black text-white px-1.5 py-0.2 rounded text-[10px]">
                          {getOrderTypeLabel()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-extrabold">
                      {order.items.map((it, i) => (
                        <div key={i} className="border-b border-dotted border-gray-300 pb-1">
                          <div className="flex justify-between">
                            <span>{it.quantity} × {it.name} {it.weightLabel ? `(${it.weightLabel})` : ''}</span>
                          </div>
                          {(it.kitchenNotes?.length > 0 || it.customNote) && (
                            <span className="inline-block mt-0.5 bg-gray-200 text-black px-1.5 py-0.2 rounded text-[10px] font-black">
                              {it.kitchenNotes?.join('، ')} {it.customNote ? `(${it.customNote})` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Receipt Preview */}
                {(mode === 'both' || mode === 'customer') && (
                  <div>
                    <div className="text-center border-b border-black pb-1 mb-2">
                      <span className="text-xs font-black block">فاتورة العميل — FIRE &amp; ASH</span>
                      <span className="text-sm font-bold block">{order.orderNumber}</span>
                      <span className="text-[10px] text-gray-600 block">{orderTimeStr}</span>
                    </div>

                    {order.customerPhone && (
                      <div className="bg-gray-100 p-1.5 rounded text-[11px] mb-2 font-bold">
                        <div>العميل: {order.customerName || 'عميل'}</div>
                        <div>الهاتف: {order.customerPhone}</div>
                        {order.deliveryAddress && <div>العنوان: {order.deliveryAddress}</div>}
                      </div>
                    )}

                    <div className="border-b border-black pb-1 mb-1 text-[11px]">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex justify-between py-0.5">
                          <span>{it.quantity} × {it.name} {it.weightLabel ? `(${it.weightLabel})` : ''}</span>
                          <span className="font-mono">{it.totalPrice} ج.م</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-0.5 text-xs font-bold pt-1">
                      <div className="flex justify-between">
                        <span>المجموع:</span>
                        <span className="font-mono">{order.subtotal} ج.م</span>
                      </div>
                      {order.deliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span>رسوم التوصيل:</span>
                          <span className="font-mono">+{order.deliveryFee} ج.م</span>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span>الخصم:</span>
                          <span className="font-mono">-{order.discount} ج.م</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black pt-1 border-t border-black">
                        <span>الإجمالي:</span>
                        <span className="font-mono">{order.finalTotal} ج.م</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[#27272A] bg-[#141417] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTriggerPrint('kitchen')}
                  className="px-3 py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5 text-[#FFB020]" />
                  <span>بون المطبخ فقط</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerPrint('customer')}
                  className="px-3 py-2 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ReceiptText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>فاتورة العميل فقط</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] text-xs font-bold text-[#A1A1AA] transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerPrint('both')}
                  className="px-4 py-2 rounded-xl bg-[#D92D16] hover:bg-[#FF5A1F] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#D92D16]/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الريسيتين معاً</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
