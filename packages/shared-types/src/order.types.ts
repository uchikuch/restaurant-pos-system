import { OrderStatus, PaymentStatus } from "./common.types";
import { MenuItem } from "./menu.types";
import { Address, User } from "./user.types";

export interface Order {
    _id: string;
    orderNumber: string; // Human-readable order number
    userId: string;
    user?: User; // Populated field
    items: OrderItem[];
    subtotal: number;
    tax: number;
    tip: number;
    deliveryFee: number;
    discount: number;
    total: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentIntentId?: string; // Stripe payment intent ID
    orderType: 'pickup' | 'delivery' | 'dine-in';
    deliveryAddress?: Address;
    specialInstructions?: string;
    estimatedPrepTime: number; // in minutes
    actualPrepTime?: number; // in minutes
    scheduledFor?: Date; // For advance orders
    assignedToStaff?: string; // Staff member ID
    loyaltyPointsEarned: number;
    loyaltyPointsUsed: number;
    ratings?: OrderRating;
    timeline: OrderTimeline[];
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    _id: string;
    menuItemId: string;
    menuItem?: MenuItem; // Populated field
    name: string; // Snapshot of menu item name
    price: number; // Snapshot of menu item price
    quantity: number;
    customizations: SelectedCustomization[];
    specialInstructions?: string;
    subtotal: number; // price * quantity + customization costs
}

export interface SelectedCustomization {
    customizationId: string;
    customizationName: string;
    selectedOptions: {
        optionId: string;
        optionName: string;
        priceModifier: number;
    }[];
}

export interface OrderTimeline {
    status: OrderStatus;
    timestamp: Date;
    staffId?: string;
    staff?: User;
    notes?: string;
}

export interface OrderRating {
    overall: number; // 1-5 stars
    food: number;
    service: number;
    delivery?: number;
    comment?: string;
    ratedAt: Date;
}

export interface CreateOrderDto {
    items: CreateOrderItemDto[];
    orderType: 'pickup' | 'delivery' | 'dine-in';
    deliveryAddress?: Address;
    specialInstructions?: string;
    scheduledFor?: Date;
    loyaltyPointsToUse?: number;
    tip?: number;
}

export interface CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    customizations?: SelectedCustomization[];
    specialInstructions?: string;
}