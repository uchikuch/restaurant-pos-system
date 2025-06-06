import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemCustomizationOptionDto {
    @IsString()
    @IsNotEmpty()
    optionId: string;

    @IsString()
    @IsNotEmpty()
    optionName: string;

    @IsNumber()
    priceModifier: number;
}

export class CartItemCustomizationDto {
    @IsString()
    @IsNotEmpty()
    customizationId: string;

    @IsString()
    @IsNotEmpty()
    customizationName: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemCustomizationOptionDto)
    selectedOptions: CartItemCustomizationOptionDto[];
}

export class AddToCartDto {
    @IsString()
    @IsNotEmpty()
    menuItemId: string;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CartItemCustomizationDto)
    customizations?: CartItemCustomizationDto[];

    @IsString()
    @IsOptional()
    specialInstructions?: string;
}