export type POSOrderType = 'takeaway' | 'dine_in' | 'delivery';
export type POSPaymentMethod = 'cash' | 'vodafone_cash' | 'instapay';
export type POSOrderStatus = 'completed' | 'cancelled';

export interface POSOrderItem {
  itemId: string;
  name: string;
  categoryId?: string;
  price: number; // Unit price
  weightLabel?: string; // e.g. "ربع كيلو", "نصف فرخة", etc.
  quantity: number;
  kitchenNotes: string[]; // e.g. ["بدون بصل", "حار"]
  customNote?: string;
  totalPrice: number;
}

export interface CustomerRecord {
  phone: string;
  name: string;
  addresses: string[];
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface POSOrder {
  id: string;
  orderNumber: string; // e.g. "#001"
  dailyOrderSeq: number; // e.g. 1, 2, 3
  businessDate: string; // YYYY-MM-DD
  orderType: POSOrderType;
  tableNumber?: string;
  paymentMethod: POSPaymentMethod;
  status: POSOrderStatus;

  // Customer information
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;

  // Items
  items: POSOrderItem[];

  // Totals
  subtotal: number;
  deliveryFee: number;
  discount: number;
  finalTotal: number;

  notes?: string;

  // Metadata
  createdBy: string;
  createdByName?: string;
  createdAt: any;
  updatedAt: any;
}

export interface DailySummary {
  businessDate: string;
  totalSales: number;
  ordersCount: number;
  cancelledCount: number;
  cashTotal: number;
  vodafoneCashTotal: number;
  instapayTotal: number;
  dineInCount: number;
  takeawayCount: number;
  deliveryCount: number;
  updatedAt: any;
}
