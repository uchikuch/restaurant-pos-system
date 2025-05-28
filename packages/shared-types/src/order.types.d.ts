import { OrderStatus, PaymentStatus } from "./common.types";
import { MenuItem } from "./menu.types";
import { Address, User } from "./user.types";
export interface Order {
    _id: string;
    orderNumber: string;
    userId: string;
    user?: User;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    tip: number;
    deliveryFee: number;
    discount: number;
    total: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentIntentId?: string;
    orderType: 'pickup' | 'delivery' | 'dine-in';
    deliveryAddress?: Address;
    specialInstructions?: string;
    estimatedPrepTime: number;
    actualPrepTime?: number;
    scheduledFor?: Date;
    assignedToStaff?: string;
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
    menuItem?: MenuItem;
    name: string;
    price: number;
    quantity: number;
    customizations: SelectedCustomization[];
    specialInstructions?: string;
    subtotal: number;
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
    overall: number;
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
