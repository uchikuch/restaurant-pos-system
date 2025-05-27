import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoyaltyAccountDocument = LoyaltyAccount & Document;

@Schema()
export class LoyaltyTransaction {
    @Prop({ required: true, enum: ['earned', 'redeemed', 'expired', 'bonus'] })
    type: string;

    @Prop({ required: true })
    points: number;

    @Prop({ type: Types.ObjectId, ref: 'Order' })
    orderId?: Types.ObjectId;

    @Prop({ required: true })
    description: string;

    @Prop()
    expiresAt?: Date;

    @Prop({ required: true, default: Date.now })
    createdAt: Date;
}

@Schema({ timestamps: true })
export class LoyaltyAccount {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true, default: 0, min: 0 })
    totalPoints: number;

    @Prop({ required: true, default: 0, min: 0 })
    pointsEarned: number;

    @Prop({ required: true, default: 0, min: 0 })
    pointsUsed: number;

    @Prop({ required: true, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' })
    tier: string;

    @Prop({ required: true, default: 0, min: 0, max: 100 })
    tierProgress: number;

    @Prop({ type: [LoyaltyTransaction], default: [] })
    transactions: LoyaltyTransaction[];
}

export const LoyaltyAccountSchema = SchemaFactory.createForClass(LoyaltyAccount);

LoyaltyAccountSchema.index({ userId: 1 }, { unique: true });
LoyaltyAccountSchema.index({ tier: 1 });
