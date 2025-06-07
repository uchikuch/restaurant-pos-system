// apps/api/src/payment/stripe-webhook.controller.ts
import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
    RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class StripeWebhookController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('stripe')
    @Public()
    @ApiExcludeEndpoint()
    async handleStripeWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ) {
        try {
            const result = await this.paymentService.handleWebhook(
                signature,
                req.rawBody,
            );
            res.status(200).json(result);
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(400).json({ error: error.message });
        }
    }
}