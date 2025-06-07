// apps/api/src/payment/dto/create-payment-intent.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
    @ApiProperty({ description: 'Order ID to create payment for' })
    @IsNotEmpty()
    @IsString()
    orderId: string;

    @ApiProperty({
        description: 'Payment method ID from Stripe',
        required: false
    })
    @IsOptional()
    @IsString()
    paymentMethodId?: string;

    @ApiProperty({
        description: 'Additional metadata for the payment',
        required: false
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export class ConfirmPaymentDto {
    @ApiProperty({ description: 'Payment Intent ID from Stripe' })
    @IsNotEmpty()
    @IsString()
    paymentIntentId: string;

    @ApiProperty({
        description: 'Payment method ID from Stripe',
        required: false
    })
    @IsOptional()
    @IsString()
    paymentMethodId?: string;
}