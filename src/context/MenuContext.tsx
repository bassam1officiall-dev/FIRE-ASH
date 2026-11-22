import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MENU_ITEMS } from '../data/menuData';
import type { MenuItem } from '../types/menu';

interface MenuContextType {
  items: MenuItem[];
  loading: boolean;
  isLive: boolean;
  firestoreItemCount: number;
  seedMenuItems: () => Promise<void>;
  toggleAvailability: (itemId: string, currentStatus: boolean) => Promise<void>;
  saveMenuItem: (itemData: Partial<MenuItem> & { id?: string }) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Immediately initialize state with local items from src/data/menuData as a non-blocking fallback
  const [items, setItems] = useState<MenuItem[]>(() => {
    return MENU_ITEMS.map((item, index) => ({
      ...item,
      isAvailable: item.isAvailable ?? true,
      sortOrder: item.sortOrder ?? index,
    }));
  });

  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [firestoreItemCount, setFirestoreItemCount] = useState<number>(0);

  useEffect(() => {
    if (!db) {
      console.warn('[MenuContext] Firebase Firestore is not initialized. Using local fallback.');
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'menu_items'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setFirestoreItemCount(snapshot.size);

          if (!snapshot.empty) {
            const liveItems: MenuItem[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                name: data.name || '',
                categoryId: data.categoryId || 'sandwiches',
                categoryName: data.categoryName || 'ساندوتشات',
                price: Number(data.price || 0),
                description: data.description || '',
                image: data.image || '/images/dishes/sandwich-kofta.webp',
                imageUrl: data.imageUrl || undefined,
                weights: Array.isArray(data.weights) ? data.weights : undefined,
                ingredients: Array.isArray(data.ingredients) ? data.ingredients : undefined,
                badge: data.badge || undefined,
                cravings: Array.isArray(data.cravings) ? data.cravings : ['all'],
                isPopular: Boolean(data.isPopular),
                isSignature: Boolean(data.isSignature),
                isAvailable: data.isAvailable !== false,
                sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 999,
              } as MenuItem;
            });

            // Sort by sortOrder
            liveItems.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
            setItems(liveItems);
            setIsLive(true);
          } else {
            // Keep local fallback if Firestore collection is empty
            setIsLive(false);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('[MenuContext] Firestore subscription error:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[MenuContext] Error attaching snapshot listener:', err);
      setLoading(false);
    }
  }, []);

  // 1-Click Initial Seed: writes all 25 items using deterministic doc IDs
  const seedMenuItems = async () => {
    if (!db) {
      throw new Error('قاعدة بيانات فايربيس غير متصلة.');
    }

    const firestore = db;
    const batch = writeBatch(firestore);
    MENU_ITEMS.forEach((item, index) => {
      const docRef = doc(firestore, 'menu_items', item.id);
      const payload: Record<string, any> = {
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        price: item.price,
        description: item.description,
        image: item.image,
        cravings: item.cravings,
        isPopular: item.isPopular ?? false,
        isSignature: item.isSignature ?? false,
        isAvailable: item.isAvailable ?? true,
        sortOrder: index,
        updatedAt: serverTimestamp(),
      };

      if (item.imageUrl) payload.imageUrl = item.imageUrl;
      if (item.weights) payload.weights = item.weights;
      if (item.ingredients) payload.ingredients = item.ingredients;
      if (item.badge) payload.badge = item.badge;

      batch.set(docRef, payload, { merge: true });
    });

    await batch.commit();
  };

  // Instant 1-tap toggle for item availability
  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    if (!db) {
      // Offline fallback
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: !currentStatus } : item
        )
      );
      return;
    }

    const firestore = db;
    const docRef = doc(firestore, 'menu_items', itemId);
    await updateDoc(docRef, {
      isAvailable: !currentStatus,
      updatedAt: serverTimestamp(),
    });
  };

  // Save (Create or Update) Item
  const saveMenuItem = async (itemData: Partial<MenuItem> & { id?: string }) => {
    if (!db) {
      throw new Error('قاعدة بيانات فايربيس غير متصلة.');
    }

    const firestore = db;
    const isNew = !itemData.id;
    const docId = itemData.id || `dish-${Date.now()}`;
    const docRef = doc(firestore, 'menu_items', docId);

    const payload: Record<string, any> = {
      ...itemData,
      id: docId,
      updatedAt: serverTimestamp(),
    };

    if (isNew && payload.sortOrder === undefined) {
      payload.sortOrder = items.length;
    }
    if (payload.isAvailable === undefined) {
      payload.isAvailable = true;
    }

    // Clean undefined fields so Firestore doesn't reject
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    await setDoc(docRef, payload, { merge: true });
  };

  // Delete Item
  const deleteMenuItem = async (itemId: string) => {
    if (!db) {
      throw new Error('قاعدة بيانات فايربيس غير متصلة.');
    }
    const firestore = db;
    const docRef = doc(firestore, 'menu_items', itemId);
    await deleteDoc(docRef);
  };

  return (
    <MenuContext.Provider
      value={{
        items,
        loading,
        isLive,
        firestoreItemCount,
        seedMenuItems,
        toggleAvailability,
        saveMenuItem,
        deleteMenuItem,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
