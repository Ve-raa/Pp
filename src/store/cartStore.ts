import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, Service } from '../types';

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  promoType: 'percentage' | 'fixed' | null;

  // Computed
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;

  // Actions
  addItem: (service: Service, quantity?: number, notes?: string) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  setPromo: (code: string, discount: number, type: 'percentage' | 'fixed') => void;
  removePromo: () => void;
  syncWithServer: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      promoType: null,

      subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      total: () => {
        const subtotal = get().subtotal();
        const { promoDiscount, promoType } = get();
        if (!promoType) return subtotal;
        if (promoType === 'percentage') return subtotal * (1 - promoDiscount / 100);
        return Math.max(0, subtotal - promoDiscount);
      },

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      addItem: (service, quantity = 1, notes) => {
        set((state) => {
          const existing = state.items.find((i) => i.serviceId === service.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.serviceId === service.id ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          const newItem: CartItem = {
            id: `${service.id}_${Date.now()}`,
            serviceId: service.id,
            service,
            quantity,
            price: service.price,
            notes,
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (serviceId) => {
        set((state) => ({ items: state.items.filter((i) => i.serviceId !== serviceId) }));
      },

      updateQuantity: (serviceId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(serviceId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.serviceId === serviceId ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0, promoType: null }),

      setPromo: (code, discount, type) => set({ promoCode: code, promoDiscount: discount, promoType: type }),

      removePromo: () => set({ promoCode: null, promoDiscount: 0, promoType: null }),

      syncWithServer: (items) => set({ items }),
    }),
    {
      name: 'vera-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist items and promo — computed functions are not serialisable
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        promoDiscount: state.promoDiscount,
        promoType: state.promoType,
      }),
    }
  )
);
