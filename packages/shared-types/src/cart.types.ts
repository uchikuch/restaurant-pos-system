// packages/shared-types/src/cart.types.ts
import { MenuItem } from "./menu.types";

export interface Cart {
    _id: string;
    userId?: string; // Optional for guest carts
    sessionId?: string; // For guest users
    items: CartItem[];
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    total: number;
    orderType: 'pickup' | 'delivery' | 'dine-in';
    deliveryAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        instructions?: string;
    };
    specialInstructions?: string;
    estimatedPrepTime: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date; // Auto-expire guest carts
}

export interface CartItem {
    _id: string;
    menuItemId: string;
    menuItem?: MenuItem; // Populated field
    name: string; // Snapshot of menu item name
    basePrice: number; // Snapshot of menu item base price
    quantity: number;
    customizations: CartItemCustomization[];
    specialInstructions?: string;
    itemPrice: number; // Base price + customization modifiers
    subtotal: number; // itemPrice * quantity
}

export interface CartItemCustomization {
    customizationId: string;
    customizationName: string;
    selectedOptions: {
        optionId: string;
        optionName: string;
        priceModifier: number;
    }[];
}

export interface AddToCartDto {
    menuItemId: string;
    quantity: number;
    customizations?: CartItemCustomization[];
    specialInstructions?: string;
}

export interface UpdateCartItemDto {
    quantity?: number;
    customizations?: CartItemCustomization[];
    specialInstructions?: string;
}

export interface UpdateCartDto {
    orderType?: 'pickup' | 'delivery' | 'dine-in';
    deliveryAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        instructions?: string;
    };
    specialInstructions?: string;
}

export interface CartSummary {
    itemCount: number;
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount: number;
    total: number;
    estimatedPrepTime: number;
}