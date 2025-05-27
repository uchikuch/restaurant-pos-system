import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@restaurant-pos/shared-types';
import { Address } from 'src/users/schemas/user.schema';

export type OrderDocument = Order & Document;

@Schema()
export class SelectedCustomization {
    @Prop({ required: true })
    customizationId: string;

    @Prop({ required: true })
    customizationName: string;

    @Prop({
        type: [{
            optionId: String,
            optionName: String,
            priceModifier: Number,
        }]
    })
    selectedOptions: {
        optionId: string;
        optionName: string;
        priceModifier: number;
    }[];
}

@Schema()
export class OrderItem {
    @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true })
    menuItemId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ type: [SelectedCustomization], default: [] })
    customizations: SelectedCustomization[];

    @Prop()
    specialInstructions?: string;

    @Prop({ required: true, min: 0 })
    subtotal: number;
}

@Schema()
export class OrderTimeline {
    @Prop({ required: true, enum: OrderStatus })
    status: OrderStatus;

    @Prop({ required: true, default: Date.now })
    timestamp: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    staffId?: Types.ObjectId;

    @Prop()
    notes?: string;
}

@Schema()
export class OrderRating {
    @Prop({ required: true, min: 1, max: 5 })
    overall: number;

    @Prop({ required: true, min: 1, max: 5 })
    food: number;

    @Prop({ required: true, min: 1, max: 5 })
    service: number;

    @Prop({ min: 1, max: 5 })
    delivery?: number;

    @Prop()
    comment?: string;

    @Prop({ required: true, default: Date.now })
    ratedAt: Date;
}

@Schema({ timestamps: true })
export class Order {
    @Prop({ required: true, unique: true })
    orderNumber: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: [OrderItem], required: true })
    items: OrderItem[];

    @Prop({ required: true, min: 0 })
    subtotal: number;

    @Prop({ required: true, min: 0 })
    tax: number;

    @Prop({ default: 0, min: 0 })
    tip: number;

    @Prop({ default: 0, min: 0 })
    deliveryFee: number;

    @Prop({ default: 0, min: 0 })
    discount: number;

    @Prop({ required: true, min: 0 })
    total: number;

    @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: PaymentStatus;

    @Prop()
    paymentIntentId?: string;

    @Prop({ required: true, enum: ['pickup', 'delivery', 'dine-in'] })
    orderType: string;

    @Prop({ type: Address })
    deliveryAddress?: Address;

    @Prop()
    specialInstructions?: string;

    @Prop({ required: true, min: 1 })
    estimatedPrepTime: number;

    @Prop({ min: 1 })
    actualPrepTime?: number;

    @Prop()
    scheduledFor?: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    assignedToStaff?: Types.ObjectId;

    @Prop({ default: 0, min: 0 })
    loyaltyPointsEarned: number;

    @Prop({ default: 0, min: 0 })
    loyaltyPointsUsed: number;

    @Prop({ type: OrderRating })
    ratings?: OrderRating;

    @Prop({ type: [OrderTimeline], default: [] })
    timeline: OrderTimeline[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Create indexes
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderType: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ assignedToStaff: 1 });

// Pre-save middleware to generate order number
OrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.orderNumber = `ORD-${dateStr}-${randomStr}`;
    }
    next();
});