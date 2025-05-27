import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MenuItemDocument = MenuItem & Document;

@Schema()
export class CustomizationOption {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, default: 0 })
    priceModifier: number;

    @Prop({ default: true })
    isAvailable: boolean;
}

@Schema()
export class MenuCustomization {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['radio', 'checkbox', 'select'] })
    type: string;

    @Prop({ default: false })
    required: boolean;

    @Prop()
    maxSelections?: number;

    @Prop({ type: [CustomizationOption] })
    options: CustomizationOption[];
}

@Schema()
export class NutritionInfo {
    @Prop({ required: true })
    calories: number;

    @Prop({ required: true })
    protein: number;

    @Prop({ required: true })
    carbs: number;

    @Prop({ required: true })
    fat: number;

    @Prop({ required: true })
    fiber: number;

    @Prop({ required: true })
    sugar: number;

    @Prop({ required: true })
    sodium: number;
}

@Schema({ timestamps: true })
export class MenuItem {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    description: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ default: false })
    isPopular: boolean;

    @Prop({ default: false })
    isFeatured: boolean;

    @Prop({ required: true, min: 1 })
    prepTime: number;

    @Prop({ min: 0 })
    calories?: number;

    @Prop({ type: [String], default: [] })
    allergens: string[];

    @Prop({
        type: {
            vegetarian: { type: Boolean, default: false },
            vegan: { type: Boolean, default: false },
            glutenFree: { type: Boolean, default: false },
            dairyFree: { type: Boolean, default: false },
            nutFree: { type: Boolean, default: false },
            spicy: { type: Number, default: 0, min: 0, max: 5 },
        },
        default: {}
    })
    dietaryInfo: {
        vegetarian: boolean;
        vegan: boolean;
        glutenFree: boolean;
        dairyFree: boolean;
        nutFree: boolean;
        spicy: number;
    };

    @Prop({ type: [MenuCustomization], default: [] })
    customizations: MenuCustomization[];

    @Prop({ type: NutritionInfo })
    nutritionInfo?: NutritionInfo;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ default: 0 })
    sortOrder: number;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

// Create indexes
MenuItemSchema.index({ categoryId: 1 });
MenuItemSchema.index({ isAvailable: 1 });
MenuItemSchema.index({ isPopular: 1 });
MenuItemSchema.index({ isFeatured: 1 });
MenuItemSchema.index({ price: 1 });
MenuItemSchema.index({ sortOrder: 1 });
MenuItemSchema.index({ tags: 1 });
MenuItemSchema.index({ name: 'text', description: 'text' }); // Text search