import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemCustomizationDto } from './add-to-cart.dto';

export class UpdateCartItemDto {
    @IsNumber()
    @Min(1)
    @IsOptional()
    quantity?: number;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CartItemCustomizationDto)
    customizations?: CartItemCustomizationDto[];

    @IsString()
    @IsOptional()
    specialInstructions?: string;
}