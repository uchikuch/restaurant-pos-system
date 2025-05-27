import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus } from '@restaurant-pos/shared-types';

export type PaymentDocument = Payment & Document;

@Schema()
export class PaymentRefund {
    @Prop({ required: true })
    stripeRefundId: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ required: true })
    reason: string;

    @Prop({ required: true, enum: ['pending', 'succeeded', 'failed'] })
    status: string;

    @Prop({ required: true, default: Date.now })
    createdAt: Date;
}

@Schema({ timestamps: true })
export class Payment {
    @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
    orderId: Types.ObjectId;

    @Prop({ required: true, unique: true })
    stripePaymentIntentId: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ required: true, default: 'usd' })
    currency: string;

    @Prop({ required: true, enum: PaymentStatus })
    status: PaymentStatus;

    @Prop({
        type: {
            type: String,
            last4: String,
            brand: String,
        }
    })
    paymentMethod: {
        type: string;
        last4?: string;
        brand?: string;
    };

    @Prop({ type: [PaymentRefund], default: [] })
    refunds: PaymentRefund[];

    @Prop({ type: Map, of: String, default: {} })
    metadata: Record<string, string>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true });
PaymentSchema.index({ status: 1 });