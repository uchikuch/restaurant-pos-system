// apps/api/src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@restaurant-pos/shared-types';

export type UserDocument = User & Document;

@Schema({
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            ret.id = ret._id;
            delete ret._id;
            return ret;
        }
    }
})
export class User {
    @Prop({ required: true, trim: true })
    firstName: string;

    @Prop({ required: true, trim: true })
    lastName: string;

    @Prop({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    })
    email: string;

    @Prop({ required: true, minlength: 6 })
    password: string;

    @Prop({
        required: false,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    })
    phone?: string;

    @Prop({
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.CUSTOMER
    })
    role: UserRole;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isEmailVerified: boolean;

    @Prop({ default: false })
    isPhoneVerified: boolean;

    @Prop()
    emailVerificationToken?: string;

    @Prop()
    passwordResetToken?: string;

    @Prop()
    passwordResetExpires?: Date;

    @Prop({ type: Date })
    lastLoginAt?: Date;

    @Prop()
    avatar?: string;

    // Customer-specific fields
    @Prop({
        type: [{
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            isDefault: { type: Boolean, default: false },
            label: { type: String, default: 'Home' }
        }],
        default: []
    })
    addresses: Array<{
        street: string;
        city: string;
        state: string;
        zipCode: string;
        isDefault: boolean;
        label: string;
    }>;

    @Prop({
        type: {
            dietaryRestrictions: [{ type: String }],
            favoriteCategories: [{ type: String }],
            spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra-hot'], default: 'medium' }
        },
        default: {}
    })
    preferences: {
        dietaryRestrictions: string[];
        favoriteCategories: string[];
        spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
    };

    // Staff-specific fields
    @Prop()
    employeeId?: string;

    @Prop()
    department?: string;

    @Prop({ type: Date })
    hireDate?: Date;

    // Refresh token for JWT
    @Prop()
    refreshToken?: string;

    // Computed field for full name
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Create indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ employeeId: 1 }, { sparse: true });