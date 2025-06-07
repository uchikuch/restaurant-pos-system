// apps/api/src/payment/payment.controller.ts
import {
    Controller,
    Post,
    Body,
    UseGuards,
    Param,
    Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto, ConfirmPaymentDto } from './dto/create-payment-intent.dto';
import { UserRole } from '@restaurant-pos/shared-types';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('create-intent')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create payment intent for an order' })
    async createPaymentIntent(
        @Body() dto: CreatePaymentIntentDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.paymentService.createPaymentIntent(dto, userId);
    }

    @Post('confirm')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Confirm payment status' })
    async confirmPayment(@Body() dto: ConfirmPaymentDto) {
        return this.paymentService.confirmPayment(dto);
    }

    @Post('refund/:orderId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Refund an order payment (Admin only)' })
    async refundOrder(
        @Param('orderId') orderId: string,
        @Body() body: { amount?: number; reason?: string },
    ) {
        return this.paymentService.createRefund(
            orderId,
            body.amount,
            body.reason,
        );
    }
}