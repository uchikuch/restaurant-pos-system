export interface Category {
    _id: string;
    name: string;
    description?: string;
    image?: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MenuItem {
    _id: string;
    name: string;
    description: string;
    categoryId: string;
    category?: Category; // Populated field
    basePrice: number;
    images: string[];
    isAvailable: boolean;
    isPopular: boolean;
    isFeatured: boolean;
    prepTime: number; // in minutes
    calories?: number;
    allergens: string[];
    dietaryInfo: {
        vegetarian: boolean;
        vegan: boolean;
        glutenFree: boolean;
        dairyFree: boolean;
        nutFree: boolean;
        spicy: number; // 0-5 scale
    };
    customizations: MenuCustomization[];
    nutritionInfo?: NutritionInfo;
    tags: string[];
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface MenuCustomization {
    _id: string;
    name: string;
    type: 'radio' | 'checkbox' | 'select';
    required: boolean;
    maxSelections?: number;
    options: CustomizationOption[];
}

export interface CustomizationOption {
    _id: string;
    name: string;
    priceModifier: number;
    isAvailable: boolean;
}

export interface NutritionInfo {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
}

export interface CreateMenuItemDto {
    name: string;
    description: string;
    categoryId: string;
    price: number;
    images?: string[];
    prepTime: number;
    calories?: number;
    allergens?: string[];
    dietaryInfo?: Partial<MenuItem['dietaryInfo']>;
    customizations?: MenuCustomization[];
    nutritionInfo?: NutritionInfo;
    tags?: string[];
}