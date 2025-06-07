// apps/api/src/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { StripeWebhookController } from './stripe-webhook.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Order, OrderSchema } from 'src/orders/schemas/order.schema';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [PaymentController, StripeWebhookController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }