// apps/api/src/orders/dto/order-query.dto.ts
import { IsOptional, IsEnum, IsString, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '@restaurant-pos/shared-types';

export class OrderQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsEnum(PaymentStatus)
    paymentStatus?: PaymentStatus;

    @IsOptional()
    @IsEnum(['pickup', 'delivery', 'dine-in'])
    orderType?: 'pickup' | 'delivery' | 'dine-in';

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    assignedToStaff?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    orderNumber?: string;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @IsString()
    search?: string; // Search in order number, customer name, etc.
}

export class KitchenOrderQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsEnum([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY])
    status?: OrderStatus.PENDING | OrderStatus.CONFIRMED | OrderStatus.PREPARING | OrderStatus.READY;

    @IsOptional()
    @IsEnum(['pickup', 'delivery', 'dine-in'])
    orderType?: 'pickup' | 'delivery' | 'dine-in';

    @IsOptional()
    @IsString()
    assignedToStaff?: string;

    @IsOptional()
    @IsString()
    priority?: 'high' | 'normal' | 'low';

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'asc';
}

export class CustomerOrderQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}