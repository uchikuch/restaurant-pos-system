// apps/api/src/menu-items/schemas/menu-item.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MenuItemDocument = MenuItem & Document;

@Schema()
export class CustomizationOption {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    priceModifier: number; // Can be negative for discounts

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop()
    description?: string;
}

@Schema()
export class Customization {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['radio', 'checkbox', 'select'] })
    type: 'radio' | 'checkbox' | 'select';

    @Prop({ default: false })
    required: boolean;

    @Prop({ default: 1, min: 1 })
    minSelections: number;

    @Prop({ default: 1, min: 1 })
    maxSelections: number;

    @Prop({ type: [CustomizationOption], required: true })
    options: CustomizationOption[];

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop()
    description?: string;
}

@Schema()
export class NutritionalInfo {
    @Prop({ min: 0 })
    calories?: number;

    @Prop({ min: 0 })
    protein?: number; // grams

    @Prop({ min: 0 })
    carbs?: number; // grams

    @Prop({ min: 0 })
    fat?: number; // grams

    @Prop({ min: 0 })
    fiber?: number; // grams

    @Prop({ min: 0 })
    sugar?: number; // grams

    @Prop({ min: 0 })
    sodium?: number; // milligrams
}

@Schema({
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            ret.id = ret._id;
            delete ret._id;
            return ret;
        }
    }
})
export class MenuItem {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    description: string;

    @Prop({ unique: true })
    slug: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    basePrice: number;

    @Prop({
        type: [{ type: String }],
        default: []
    })
    images: string[];

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ default: false })
    isSpicy: boolean;

    @Prop({
        type: [{ type: String, enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'keto', 'low-carb', 'halal', 'kosher'] }],
        default: []
    })
    dietaryRestrictions: string[];

    @Prop({
        type: [{ type: String }],
        default: []
    })
    allergens: string[];

    @Prop({
        type: [{ type: String }],
        default: []
    })
    tags: string[];

    @Prop({ type: NutritionalInfo })
    nutritionalInfo?: NutritionalInfo;

    @Prop({ type: [Customization], default: [] })
    customizations: Customization[];

    @Prop({ default: 0, min: 0 })
    preparationTime: number; // minutes

    @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
    complexity: 'easy' | 'medium' | 'hard';

    @Prop({ default: 0 })
    sortOrder: number;

    @Prop({
        type: {
            breakfast: { type: Boolean, default: false },
            lunch: { type: Boolean, default: true },
            dinner: { type: Boolean, default: true },
            lateNight: { type: Boolean, default: false }
        },
        default: {
            breakfast: false,
            lunch: true,
            dinner: true,
            lateNight: false
        }
    })
    availability: {
        breakfast: boolean;
        lunch: boolean;
        dinner: boolean;
        lateNight: boolean;
    };

    @Prop({
        type: [{
            day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true }
        }],
        default: []
    })
    schedule: Array<{
        day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
        startTime: string;
        endTime: string;
    }>;

    @Prop({ default: 0 })
    stockQuantity: number; // For items with limited quantity

    @Prop({ default: false })
    trackInventory: boolean;

    @Prop({ default: 0 })
    soldCount: number; // Track popularity

    @Prop({ default: 0, min: 0, max: 5 })
    averageRating: number;

    @Prop({ default: 0 })
    reviewCount: number;

    // SEO fields
    @Prop()
    metaTitle?: string;

    @Prop()
    metaDescription?: string;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

// Create indexes
MenuItemSchema.index({ slug: 1 }, { unique: true });
MenuItemSchema.index({ categoryId: 1 });
MenuItemSchema.index({ isActive: 1 });
MenuItemSchema.index({ isAvailable: 1 });
MenuItemSchema.index({ isFeatured: 1 });
MenuItemSchema.index({ basePrice: 1 });
MenuItemSchema.index({ dietaryRestrictions: 1 });
MenuItemSchema.index({ tags: 1 });
MenuItemSchema.index({ averageRating: -1 });
MenuItemSchema.index({ soldCount: -1 });
MenuItemSchema.index({ sortOrder: 1 });
MenuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Compound indexes for common queries
MenuItemSchema.index({ categoryId: 1, isActive: 1, isAvailable: 1 });
MenuItemSchema.index({ isFeatured: 1, isActive: 1, isAvailable: 1 });

// Pre-save middleware to generate slug
MenuItemSchema.pre('save', function (next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
    next();
});