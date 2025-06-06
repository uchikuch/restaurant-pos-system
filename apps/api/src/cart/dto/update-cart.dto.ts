import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class DeliveryAddressDto {
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
    instructions?: string;
}

export class UpdateCartDto {
    @IsEnum(['pickup', 'delivery', 'dine-in'])
    @IsOptional()
    orderType?: 'pickup' | 'delivery' | 'dine-in';

    @ValidateNested()
    @Type(() => DeliveryAddressDto)
    @IsOptional()
    deliveryAddress?: DeliveryAddressDto;

    @IsString()
    @IsOptional()
    specialInstructions?: string;
}