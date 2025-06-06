// apps/api/src/orders/dto/order-response.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';

export class OrderItemResponseDto {
    @Expose()
    _id: string;

    @Expose()
    menuItemId: string;

    @Expose()
    name: string;

    @Expose()
    price: number;

    @Expose()
    quantity: number;

    @Expose()
    customizations: any[];

    @Expose()
    specialInstructions?: string;

    @Expose()
    subtotal: number;
}

export class OrderTimelineResponseDto {
    @Expose()
    status: string;

    @Expose()
    timestamp: Date;

    @Expose()
    staffId?: string;

    @Expose()
    notes?: string;
}

export class OrderResponseDto {
    @Expose()
    _id: string;

    @Expose()
    orderNumber: string;

    @Expose()
    userId: string;

    @Expose()
    @Type(() => OrderItemResponseDto)
    items: OrderItemResponseDto[];

    @Expose()
    subtotal: number;

    @Expose()
    tax: number;

    @Expose()
    tip: number;

    @Expose()
    deliveryFee: number;

    @Expose()
    discount: number;

    @Expose()
    total: number;

    @Expose()
    status: string;

    @Expose()
    paymentStatus: string;

    @Exclude()
    paymentIntentId?: string; // Hide from regular responses

    @Expose()
    orderType: string;

    @Expose()
    deliveryAddress?: any;

    @Expose()
    specialInstructions?: string;

    @Expose()
    estimatedPrepTime: number;

    @Expose()
    actualPrepTime?: number;

    @Expose()
    scheduledFor?: Date;

    @Expose()
    assignedToStaff?: string;

    @Expose()
    loyaltyPointsEarned: number;

    @Expose()
    loyaltyPointsUsed: number;

    @Expose()
    ratings?: any;

    @Expose()
    @Type(() => OrderTimelineResponseDto)
    timeline: OrderTimelineResponseDto[];

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}

export class KitchenOrderResponseDto {
    @Expose()
    _id: string;

    @Expose()
    orderNumber: string;

    @Expose()
    @Type(() => OrderItemResponseDto)
    items: OrderItemResponseDto[];

    @Expose()
    status: string;

    @Expose()
    orderType: string;

    @Expose()
    specialInstructions?: string;

    @Expose()
    estimatedPrepTime: number;

    @Expose()
    actualPrepTime?: number;

    @Expose()
    scheduledFor?: Date;

    @Expose()
    assignedToStaff?: string;

    @Expose()
    createdAt: Date;

    // Hide sensitive customer and payment info
    @Exclude()
    userId: string;

    @Exclude()
    deliveryAddress?: any;

    @Exclude()
    paymentStatus: string;

    @Exclude()
    paymentIntentId?: string;

    @Exclude()
    total: number;

    @Exclude()
    subtotal: number;

    @Exclude()
    tax: number;

    @Exclude()
    tip: number;
}

export class OrderSummaryResponseDto {
    @Expose()
    _id: string;

    @Expose()
    orderNumber: string;

    @Expose()
    status: string;

    @Expose()
    orderType: string;

    @Expose()
    total: number;

    @Expose()
    itemCount: number;

    @Expose()
    createdAt: Date;

    @Expose()
    estimatedPrepTime: number;
}