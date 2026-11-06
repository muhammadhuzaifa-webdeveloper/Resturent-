import { create } from 'zustand';
import { cartApi } from '@/api/endpoints';
import type { Cart, CartItem, Restaurant, MenuItem } from '@/api/types';

interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  pendingDifferentRestaurantItem: {
    item: MenuItem;
    restaurant: Restaurant;
  } | null;
  setOpen: (open: boolean) => void;
  fetchCart: () => void;
  addItem: (item: MenuItem, restaurant: Restaurant, quantity?: number) => void;
  confirmResetAndAdd: () => void;
  cancelDifferentRestaurantModal: () => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  getSubtotalPaisa: () => number;
  getDeliveryFeePaisa: () => number;
  getTotalPaisa: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isOpen: false,
  isLoading: false,
  pendingDifferentRestaurantItem: null,

  setOpen: (open: boolean) => set({ isOpen: open }),

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const res = await cartApi.get();
      set({ cart: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (item: MenuItem, restaurant: Restaurant, quantity = 1) => {
    const { cart } = get();

    // Check if cart already has items from another restaurant
    if (cart && cart.restaurantId && cart.restaurantId !== restaurant.id && cart.items.length > 0) {
      set({
        pendingDifferentRestaurantItem: { item, restaurant },
      });
      return;
    }

    try {
      set({ isLoading: true });
      await cartApi.addItem(item.id, quantity, restaurant.id, false);
      // Re-fetch updated cart
      const updated = await cartApi.get();
      set({ cart: updated.data, isLoading: false, isOpen: true });
    } catch {
      set({ isLoading: false });
    }
  },

  confirmResetAndAdd: async () => {
    const { pendingDifferentRestaurantItem } = get();
    if (!pendingDifferentRestaurantItem) return;

    const { item, restaurant } = pendingDifferentRestaurantItem;
    try {
      set({ isLoading: true, pendingDifferentRestaurantItem: null });
      await cartApi.addItem(item.id, 1, restaurant.id, true);
      const updated = await cartApi.get();
      set({ cart: updated.data, isLoading: false, isOpen: true });
    } catch {
      set({ isLoading: false });
    }
  },

  cancelDifferentRestaurantModal: () => {
    set({ pendingDifferentRestaurantItem: null });
  },

  updateQuantity: async (menuItemId: string, quantity: number) => {
    try {
      set({ isLoading: true });
      await cartApi.updateQuantity(menuItemId, quantity);
      const updated = await cartApi.get();
      set({ cart: updated.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  removeItem: async (menuItemId: string) => {
    try {
      set({ isLoading: true });
      await cartApi.updateQuantity(menuItemId, 0);
      const updated = await cartApi.get();
      set({ cart: updated.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    try {
      set({ isLoading: true });
      await cartApi.clear();
      set({
        cart: {
          id: 'cart-empty',
          userId: 'user',
          restaurantId: null,
          items: [],
        },
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  getSubtotalPaisa: () => {
    const { cart } = get();
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum: number, line: CartItem) => {
      const price = line.menuItem?.discountPricePaisa || line.menuItem?.pricePaisa || 0;
      return sum + price * line.quantity;
    }, 0);
  },

  getDeliveryFeePaisa: () => {
    const { cart } = get();
    if (!cart || !cart.restaurant || cart.items.length === 0) return 0;
    return cart.restaurant.deliveryFeePaisa || 0;
  },

  getTotalPaisa: () => {
    const subtotal = get().getSubtotalPaisa();
    const fee = get().getDeliveryFeePaisa();
    return subtotal + fee;
  },

  getItemCount: () => {
    const { cart } = get();
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((count: number, item: CartItem) => count + item.quantity, 0);
  },
}));
