// apps/api/src/categories/schemas/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

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
export class Category {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true })
    description: string;

    @Prop({ unique: true })
    slug: string;

    @Prop()
    image?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: true })
    isAvailable: boolean;

    @Prop({ required: true, min: 0 })
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
            startTime: { type: String, required: true }, // HH:MM format
            endTime: { type: String, required: true }    // HH:MM format
        }],
        default: []
    })
    schedule: Array<{
        day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
        startTime: string;
        endTime: string;
    }>;

    @Prop({
        type: [{ type: String }],
        default: []
    })
    tags: string[];

    @Prop()
    icon?: string; // Icon name or emoji for the category

    @Prop()
    color?: string; // Hex color for theming

    @Prop({ default: 0 })
    itemCount: number; // Computed field for number of items in category
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Create indexes
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ isAvailable: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ name: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to generate slug
CategorySchema.pre('save', function (next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')         // Replace spaces with hyphens
            .replace(/-+/g, '-')          // Replace multiple hyphens with single
            .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
    }
    next();
});