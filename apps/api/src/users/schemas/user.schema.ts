import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@restaurant-pos/shared-types';

export type UserDocument = User & Document;

@Schema()
export class Address {
    @Prop({ required: true, enum: ['home', 'work', 'other'] })
    type: string;

    @Prop({ required: true })
    street: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    zipCode: string;

    @Prop({ required: true, default: 'US' })
    country: string;

    @Prop({ default: false })
    isDefault: boolean;

    @Prop()
    instructions?: string;
}

@Schema()
export class UserPreferences {
    @Prop({
        type: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            orderUpdates: { type: Boolean, default: true },
            promotions: { type: Boolean, default: true },
        }
    })
    notifications: {
        email: boolean;
        sms: boolean;
        orderUpdates: boolean;
        promotions: boolean;
    };

    @Prop({
        type: {
            vegetarian: Boolean,
            vegan: Boolean,
            glutenFree: Boolean,
            dairyFree: Boolean,
            nutFree: Boolean,
            other: [String],
        }
    })
    dietary?: {
        vegetarian?: boolean;
        vegan?: boolean;
        glutenFree?: boolean;
        dairyFree?: boolean;
        nutFree?: boolean;
        other?: string[];
    };
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    email: string;

    @Prop({ required: true, select: false }) // Exclude by default
    password: string;

    @Prop({ required: true, trim: true })
    firstName: string;

    @Prop({ required: true, trim: true })
    lastName: string;

    @Prop({ sparse: true }) // Allow null but enforce uniqueness when present
    phone?: string;

    @Prop({ required: true, enum: UserRole, default: UserRole.CUSTOMER })
    role: UserRole;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    emailVerified: boolean;

    @Prop({ default: false })
    phoneVerified: boolean;

    @Prop()
    avatar?: string;

    @Prop({ type: [Address] })
    addresses?: Address[];

    @Prop({ type: UserPreferences })
    preferences?: UserPreferences;

    @Prop({ type: Date })
    lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });