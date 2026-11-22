import { doc, setDoc, increment, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { POSOrder } from '../types/pos';
import { stripUndefined } from './firestoreClean';

/**
 * Atomically updates daily_summaries/{businessDate} when an order is created or updated.
 */
export async function recordOrderDailySummary(
  db: Firestore,
  order: POSOrder,
  isNew: boolean,
  previousOrder?: POSOrder
): Promise<void> {
  const summaryRef = doc(db, 'daily_summaries', order.businessDate);

  if (isNew) {
    await setDoc(
      summaryRef,
      stripUndefined({
        businessDate: order.businessDate,
        totalSales: increment(order.finalTotal),
        ordersCount: increment(1),
        cancelledCount: increment(0),
        cashTotal: increment(order.paymentMethod === 'cash' ? order.finalTotal : 0),
        vodafoneCashTotal: increment(order.paymentMethod === 'vodafone_cash' ? order.finalTotal : 0),
        instapayTotal: increment(order.paymentMethod === 'instapay' ? order.finalTotal : 0),
        dineInCount: increment(order.orderType === 'dine_in' ? 1 : 0),
        takeawayCount: increment(order.orderType === 'takeaway' ? 1 : 0),
        deliveryCount: increment(order.orderType === 'delivery' ? 1 : 0),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } else if (previousOrder) {
    // Delta adjustment if an existing order was modified
    const salesDiff = order.finalTotal - previousOrder.finalTotal;

    const oldCash = previousOrder.paymentMethod === 'cash' ? previousOrder.finalTotal : 0;
    const newCash = order.paymentMethod === 'cash' ? order.finalTotal : 0;

    const oldVodafone = previousOrder.paymentMethod === 'vodafone_cash' ? previousOrder.finalTotal : 0;
    const newVodafone = order.paymentMethod === 'vodafone_cash' ? order.finalTotal : 0;

    const oldInstapay = previousOrder.paymentMethod === 'instapay' ? previousOrder.finalTotal : 0;
    const newInstapay = order.paymentMethod === 'instapay' ? order.finalTotal : 0;

    const oldDineIn = previousOrder.orderType === 'dine_in' ? 1 : 0;
    const newDineIn = order.orderType === 'dine_in' ? 1 : 0;

    const oldTakeaway = previousOrder.orderType === 'takeaway' ? 1 : 0;
    const newTakeaway = order.orderType === 'takeaway' ? 1 : 0;

    const oldDelivery = previousOrder.orderType === 'delivery' ? 1 : 0;
    const newDelivery = order.orderType === 'delivery' ? 1 : 0;

    await setDoc(
      summaryRef,
      stripUndefined({
        businessDate: order.businessDate,
        totalSales: increment(salesDiff),
        cashTotal: increment(newCash - oldCash),
        vodafoneCashTotal: increment(newVodafone - oldVodafone),
        instapayTotal: increment(newInstapay - oldInstapay),
        dineInCount: increment(newDineIn - oldDineIn),
        takeawayCount: increment(newTakeaway - oldTakeaway),
        deliveryCount: increment(newDelivery - oldDelivery),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  }
}

/**
 * Atomically rolls back daily_summaries/{businessDate} counters when an order is cancelled.
 */
export async function cancelOrderDailySummary(
  db: Firestore,
  order: POSOrder
): Promise<void> {
  const summaryRef = doc(db, 'daily_summaries', order.businessDate);

  await setDoc(
    summaryRef,
    stripUndefined({
      businessDate: order.businessDate,
      totalSales: increment(-order.finalTotal),
      ordersCount: increment(-1),
      cancelledCount: increment(1),
      cashTotal: increment(order.paymentMethod === 'cash' ? -order.finalTotal : 0),
      vodafoneCashTotal: increment(order.paymentMethod === 'vodafone_cash' ? -order.finalTotal : 0),
      instapayTotal: increment(order.paymentMethod === 'instapay' ? -order.finalTotal : 0),
      dineInCount: increment(order.orderType === 'dine_in' ? -1 : 0),
      takeawayCount: increment(order.orderType === 'takeaway' ? -1 : 0),
      deliveryCount: increment(order.orderType === 'delivery' ? -1 : 0),
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );
}
