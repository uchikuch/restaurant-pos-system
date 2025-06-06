// apps/api/src/cart/schemas/cart.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema()
export class CartItemCustomization {
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
export class CartItem {
    @Prop({ type: Types.ObjectId, auto: true })
    _id?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true })
    menuItemId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, min: 0 })
    basePrice: number;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ type: [CartItemCustomization], default: [] })
    customizations: CartItemCustomization[];

    @Prop()
    specialInstructions?: string;

    @Prop({ required: true, min: 0 })
    itemPrice: number;

    @Prop({ required: true, min: 0 })
    subtotal: number;
}

@Schema()
export class DeliveryAddress {
    @Prop({ required: true })
    street: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    zipCode: string;

    @Prop()
    instructions?: string;
}

@Schema({ timestamps: true })
export class Cart {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId?: Types.ObjectId;

    @Prop()
    sessionId?: string;

    @Prop({ type: [CartItem], default: [] })
    items: CartItem[];

    @Prop({ default: 0, min: 0 })
    subtotal: number;

    @Prop({ default: 0, min: 0 })
    tax: number;

    @Prop({ default: 0, min: 0 })
    deliveryFee: number;

    @Prop({ default: 0, min: 0 })
    discount: number;

    @Prop({ default: 0, min: 0 })
    total: number;

    @Prop({ enum: ['pickup', 'delivery', 'dine-in'], default: 'pickup' })
    orderType: string;

    @Prop({ type: DeliveryAddress })
    deliveryAddress?: DeliveryAddress;

    @Prop()
    specialInstructions?: string;

    @Prop({ default: 0, min: 0 })
    estimatedPrepTime: number;

    @Prop({ type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }) // 24 hours from now
    expiresAt: Date;

    // Mongoose timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Create indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup
CartSchema.index({ userId: 1, sessionId: 1 });

// Ensure either userId or sessionId is present
CartSchema.pre('validate', function (next) {
    if (!this.userId && !this.sessionId) {
        next(new Error('Either userId or sessionId must be provided'));
    } else {
        next();
    }
});

// Pre-save middleware to recalculate totals
CartSchema.pre('save', function (next) {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((total, item) => total + item.subtotal, 0);

    // Calculate tax (8% of subtotal)
    this.tax = Number((this.subtotal * 0.08).toFixed(2));

    // Calculate delivery fee
    this.deliveryFee = this.orderType === 'delivery' ? 3.99 : 0;

    // Calculate total
    this.total = Number((this.subtotal + this.tax + this.deliveryFee - this.discount).toFixed(2));

    // Calculate estimated prep time directly here
    if (this.items.length === 0) {
        this.estimatedPrepTime = 0;
    } else {
        // Base time + item complexity
        let prepTime = Math.max(10, this.items.length * 5);

        // Add time for customizations
        this.items.forEach(item => {
            if (item.customizations && item.customizations.length > 0) {
                prepTime += item.customizations.length * 2;
            }
        });

        // Adjust for order type
        if (this.orderType === 'delivery') {
            prepTime += 20;
        } else if (this.orderType === 'dine-in') {
            prepTime += 5;
        }

        this.estimatedPrepTime = Math.min(prepTime, 60); // Cap at 60 minutes
    }

    next();
});