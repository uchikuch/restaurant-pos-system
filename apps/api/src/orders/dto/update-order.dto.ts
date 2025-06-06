// apps/api/src/orders/dto/update-order.dto.ts
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '@restaurant-pos/shared-types';

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdatePaymentStatusDto {
    @IsEnum(PaymentStatus)
    paymentStatus: PaymentStatus;

    @IsString()
    @IsOptional()
    paymentIntentId?: string;
}

export class AssignStaffDto {
    @IsString()
    staffId: string;
}

export class UpdatePrepTimeDto {
    @IsNumber()
    @Min(1)
    actualPrepTime: number;
}

export class OrderRatingDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    overall: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    food: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    service: number;

    @IsNumber()
    @Min(1)
    @Max(5)
    @IsOptional()
    delivery?: number;

    @IsString()
    @IsOptional()
    comment?: string;
}

export class UpdateOrderDto {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsEnum(PaymentStatus)
    @IsOptional()
    paymentStatus?: PaymentStatus;

    @IsString()
    @IsOptional()
    paymentIntentId?: string;

    @IsString()
    @IsOptional()
    specialInstructions?: string;

    @IsDateString()
    @IsOptional()
    scheduledFor?: string;

    @IsString()
    @IsOptional()
    assignedToStaff?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    actualPrepTime?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    tip?: number;

    @ValidateNested()
    @Type(() => OrderRatingDto)
    @IsOptional()
    ratings?: OrderRatingDto;

    @IsString()
    @IsOptional()
    statusNotes?: string; // Notes for status change
}