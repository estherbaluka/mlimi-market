import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  currency: string;
  unit: string;
  quantity: number;
  availableStock: number;
  imageUrl?: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            const newQty = Math.min(existing.quantity + item.quantity, item.availableStock);
            return {
              items: state.items.map((i) => (i.productId === item.productId ? { ...i, quantity: newQty } : i)),
            };
          }
          const qty = Math.min(item.quantity, item.availableStock);
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) return { items: state.items.filter((i) => i.productId !== productId) };
          return {
            items: state.items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, i.availableStock) } : i)),
          };
        }),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "mlimi-cart" }
  )
);
