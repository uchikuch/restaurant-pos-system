// lib/stores/cart.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MenuItem, OrderType, Cart as CartType } from '@restaurant-pos/shared-types';
import { api } from '../api/client';
import toast from 'react-hot-toast';

interface CartItemCustomization {
    id: string;
    name: string;
    options: string[];
    price: number;
}

interface CartItem {
    menuItem: MenuItem;
    quantity: number;
    customizations: CartItemCustomization[];
    specialInstructions?: string;
    itemTotal: number;
}

interface Cart {
    items: CartItem[];
    orderType: OrderType;
    specialInstructions?: string;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number;
}

interface CartState extends Cart {
    isLoading: boolean;
    sessionId?: string;

    // Actions
    addItem: (menuItem: MenuItem, quantity: number, customizations?: CartItemCustomization[], specialInstructions?: string) => void;
    updateItemQuantity: (menuItemId: string, quantity: number) => void;
    removeItem: (menuItemId: string) => void;
    clearCart: () => void;
    setOrderType: (type: OrderType) => void;
    setSpecialInstructions: (instructions: string) => void;
    calculateTotals: () => void;
    syncWithServer: () => Promise<void>;
    loadCart: () => Promise<void>;
    checkout: () => Promise<unknown>;
}

const TAX_RATE = 0.08; // 8% tax
const DELIVERY_FEE = 5.99;

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            orderType: 'pickup',
            subtotal: 0,
            tax: 0,
            deliveryFee: 0,
            total: 0,
            isLoading: false,

            addItem: (menuItem, quantity, customizations = [], specialInstructions) => {
                const { items } = get();

                // Calculate item total
                const customizationTotal = customizations.reduce((sum, c) => sum + c.price, 0);
                const itemTotal = (menuItem.basePrice + customizationTotal) * quantity;

                // Check if item already exists
                const existingIndex = items.findIndex(
                    item => item.menuItem._id === menuItem._id &&
                        JSON.stringify(item.customizations) === JSON.stringify(customizations)
                );

                if (existingIndex > -1) {
                    // Update quantity if item exists
                    const newItems = [...items];
                    newItems[existingIndex].quantity += quantity;
                    newItems[existingIndex].itemTotal = (menuItem.basePrice + customizationTotal) * newItems[existingIndex].quantity;
                    set({ items: newItems });
                } else {
                    // Add new item
                    const newItem: CartItem = {
                        menuItem,
                        quantity,
                        customizations,
                        specialInstructions,
                        itemTotal
                    };
                    set({ items: [...items, newItem] });
                }

                get().calculateTotals();
                get().syncWithServer();

                toast.success(`${menuItem.name} added to cart`);
            },

            updateItemQuantity: (menuItemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(menuItemId);
                    return;
                }

                const { items } = get();
                const newItems = items.map(item => {
                    if (item.menuItem._id === menuItemId) {
                        const customizationTotal = item.customizations.reduce((sum, c) => sum + c.price, 0);
                        return {
                            ...item,
                            quantity,
                            itemTotal: (item.menuItem.basePrice + customizationTotal) * quantity
                        };
                    }
                    return item;
                });

                set({ items: newItems });
                get().calculateTotals();
                get().syncWithServer();
            },

            removeItem: (menuItemId) => {
                const { items } = get();
                const newItems = items.filter(item => item.menuItem._id !== menuItemId);

                set({ items: newItems });
                get().calculateTotals();
                get().syncWithServer();

                toast.success('Item removed from cart');
            },

            clearCart: () => {
                set({
                    items: [],
                    subtotal: 0,
                    tax: 0,
                    deliveryFee: 0,
                    total: 0,
                    specialInstructions: undefined
                });
                get().syncWithServer();
            },

            setOrderType: (type) => {
                set({ orderType: type });
                get().calculateTotals();
                get().syncWithServer();
            },

            setSpecialInstructions: (instructions) => {
                set({ specialInstructions: instructions });
                get().syncWithServer();
            },

            calculateTotals: () => {
                const { items, orderType } = get();

                const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
                const tax = subtotal * TAX_RATE;
                const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
                const total = subtotal + tax + deliveryFee;

                set({
                    subtotal,
                    tax,
                    deliveryFee,
                    total
                });
            },

            syncWithServer: async () => {
                const state = get();
                const cartData = {
                    items: state.items.map(item => ({
                        menuItemId: item.menuItem._id,
                        quantity: item.quantity,
                        customizations: item.customizations,
                        specialInstructions: item.specialInstructions
                    })),
                    orderType: state.orderType,
                    specialInstructions: state.specialInstructions
                };

                try {
                    // If user is logged in, sync with user cart
                    const token = localStorage.getItem('access_token');
                    if (token) {
                        await api.post('/cart', cartData);
                    } else {
                        // Guest cart - use session ID
                        const sessionId = state.sessionId || generateSessionId();
                        await api.post(`/cart/guest/${sessionId}`, cartData);
                        set({ sessionId });
                    }
                } catch (error) {
                    console.error('Failed to sync cart:', error);
                }
            },

            loadCart: async () => {
                set({ isLoading: true });
                try {
                    const token = localStorage.getItem('access_token');
                    let cartData: CartType | null = null;

                    if (token) {
                        cartData = await api.get<CartType>('/cart');
                    } else {
                        const sessionId = get().sessionId || generateSessionId();
                        cartData = await api.get<CartType>(`/cart/guest/${sessionId}`);
                        set({ sessionId });
                    }

                    if (cartData && cartData.items) {
                        // Transform server cart to local format
                        // This would need to fetch full menu item details
                        // For now, we'll assume the server returns full data
                        set({
                            items: cartData.items as unknown as CartItem[],
                            orderType: cartData.orderType || 'pickup',
                            specialInstructions: cartData.specialInstructions
                        });
                        get().calculateTotals();
                    }
                } catch (error) {
                    console.error('Failed to load cart:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            checkout: async () => {
                set({ isLoading: true });
                try {
                    const response = await api.post<unknown>('/cart/checkout');
                    get().clearCart();
                    return response;
                } catch (error) {
                    toast.error('Checkout failed. Please try again.');
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            }
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
                orderType: state.orderType,
                sessionId: state.sessionId,
                specialInstructions: state.specialInstructions
            }),
        }
    )
);

// Helper function to generate session ID for guest users
function generateSessionId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}