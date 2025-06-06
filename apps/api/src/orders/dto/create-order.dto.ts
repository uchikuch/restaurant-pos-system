// apps/api/src/orders/dto/create-order.dto.ts
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, ValidateNested, ArrayMinSize, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { Address } from '@restaurant-pos/shared-types';

export class SelectedCustomizationOptionDto {
    @IsString()
    @IsNotEmpty()
    optionId: string;

    @IsString()
    @IsNotEmpty()
    optionName: string;

    @IsNumber()
    priceModifier: number;
}

export class SelectedCustomizationDto {
    @IsString()
    @IsNotEmpty()
    customizationId: string;

    @IsString()
    @IsNotEmpty()
    customizationName: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SelectedCustomizationOptionDto)
    selectedOptions: SelectedCustomizationOptionDto[];
}

export class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    menuItemId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SelectedCustomizationDto)
    customizations?: SelectedCustomizationDto[];

    @IsString()
    @IsOptional()
    specialInstructions?: string;
}

export class DeliveryAddressDto {
    @IsString()
    @IsOptional()
    _id?: string;

    @IsEnum(['home', 'work', 'other'])
    @IsOptional()
    type?: 'home' | 'work' | 'other';

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    state: string;

    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    instructions?: string;
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsEnum(['pickup', 'delivery', 'dine-in'])
    orderType: 'pickup' | 'delivery' | 'dine-in';

    @IsOptional()
    @ValidateNested()
    @Type(() => DeliveryAddressDto)
    deliveryAddress?: DeliveryAddressDto;

    @IsString()
    @IsOptional()
    specialInstructions?: string;

    @IsDateString()
    @IsOptional()
    scheduledFor?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    loyaltyPointsToUse?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    tip?: number;
}