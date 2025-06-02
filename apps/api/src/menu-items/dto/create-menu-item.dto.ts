import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsArray,
    ValidateNested,
    Min,
    Max,
    IsEnum,
    IsMongoId,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomizationOptionDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsNumber()
    priceModifier: number;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsString()
    description?: string;
}

class CustomizationDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsEnum(['radio', 'checkbox', 'select'])
    type: 'radio' | 'checkbox' | 'select';

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    minSelections?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    maxSelections?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomizationOptionDto)
    options: CustomizationOptionDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @IsString()
    description?: string;
}

class NutritionalInfoDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    calories?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    protein?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    carbs?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    fat?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    fiber?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    sugar?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    sodium?: number;
}

class AvailabilityDto {
    @IsOptional()
    @IsBoolean()
    breakfast?: boolean;

    @IsOptional()
    @IsBoolean()
    lunch?: boolean;

    @IsOptional()
    @IsBoolean()
    dinner?: boolean;

    @IsOptional()
    @IsBoolean()
    lateNight?: boolean;
}

class ScheduleItemDto {
    @IsEnum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
    startTime: string;

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
    endTime: string;
}

export class CreateMenuItemDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsMongoId()
    categoryId: string;

    @IsNumber()
    @Min(0)
    basePrice: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @IsOptional()
    @IsBoolean()
    isSpicy?: boolean;

    @IsOptional()
    @IsArray()
    @IsEnum(['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'keto', 'low-carb', 'halal', 'kosher'], { each: true })
    dietaryRestrictions?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    allergens?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @ValidateNested()
    @Type(() => NutritionalInfoDto)
    nutritionalInfo?: NutritionalInfoDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomizationDto)
    customizations?: CustomizationDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    preparationTime?: number;

    @IsOptional()
    @IsEnum(['easy', 'medium', 'hard'])
    complexity?: 'easy' | 'medium' | 'hard';

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => AvailabilityDto)
    availability?: AvailabilityDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleItemDto)
    schedule?: ScheduleItemDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    stockQuantity?: number;

    @IsOptional()
    @IsBoolean()
    trackInventory?: boolean;

    @IsOptional()
    @IsString()
    metaTitle?: string;

    @IsOptional()
    @IsString()
    metaDescription?: string;
}