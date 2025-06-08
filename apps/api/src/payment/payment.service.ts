// apps/api/src/payment/payment.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreatePaymentIntentDto, ConfirmPaymentDto } from './dto/create-payment-intent.dto';
import { PaymentStatus, OrderStatus } from '@restaurant-pos/shared-types';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class PaymentService {
    private stripe: Stripe;

    constructor(
        private configService: ConfigService,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private wsGateway: RestaurantWebSocketGateway,
    ) {
        this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2025-05-28.basil',
            typescript: true,
        });
    }

    async createPaymentIntent(dto: CreatePaymentIntentDto, userId: string) {
        // Find the order - convert userId string to ObjectId for query
        const order = await this.orderModel.findOne({
            _id: dto.orderId,
            userId: new Types.ObjectId(userId),
        }).exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Check if order is in pending state
        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Order is not in pending state');
        }

        // Check if payment is already completed
        if (order.paymentStatus === PaymentStatus.COMPLETED) {
            throw new BadRequestException('Payment already completed');
        }

        // Check if payment already exists
        if (order.paymentIntentId) {
            // Retrieve existing payment intent
            try {
                const existingIntent = await this.stripe.paymentIntents.retrieve(
                    order.paymentIntentId,
                );

                if (existingIntent.status === 'succeeded') {
                    throw new BadRequestException('Payment already completed');
                }

                return {
                    clientSecret: existingIntent.client_secret,
                    paymentIntentId: existingIntent.id,
                    amount: existingIntent.amount,
                    currency: existingIntent.currency,
                };
            } catch (error) {
                // If retrieval fails, create new intent
                console.log('Failed to retrieve existing payment intent:', error.message);
            }
        }

        // Get user details for payment metadata
        const user = await this.userModel.findById(userId);

        try {
            // Create payment intent
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(order.total * 100), // Convert to cents
                currency: this.configService.get('STRIPE_CURRENCY') || 'usd',
                metadata: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    userId: userId,
                    userEmail: user.email,
                    ...dto.metadata,
                },
                payment_method_types: ['card'], // This includes Apple Pay & Google Pay
                description: `Order ${order.orderNumber}`,
            });

            // Update order with payment intent ID and set to processing
            await this.orderModel.findByIdAndUpdate(order._id, {
                paymentIntentId: paymentIntent.id,
                paymentStatus: PaymentStatus.PROCESSING,
                updatedAt: new Date(),
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
            };
        } catch (error) {
            console.error('Stripe error:', error);
            throw new BadRequestException('Failed to create payment intent');
        }
    }

    async confirmPayment(dto: ConfirmPaymentDto) {
        try {
            // Retrieve payment intent to verify
            const paymentIntent = await this.stripe.paymentIntents.retrieve(
                dto.paymentIntentId,
            );

            if (paymentIntent.status === 'succeeded') {
                // Payment already succeeded, update order if needed
                await this.handleSuccessfulPayment(paymentIntent);
                return {
                    status: 'succeeded',
                    orderId: paymentIntent.metadata.orderId,
                };
            }

            // If payment method provided, confirm the payment
            if (dto.paymentMethodId) {
                const confirmedIntent = await this.stripe.paymentIntents.confirm(
                    dto.paymentIntentId,
                    {
                        payment_method: dto.paymentMethodId,
                    },
                );

                if (confirmedIntent.status === 'succeeded') {
                    await this.handleSuccessfulPayment(confirmedIntent);
                }

                return {
                    status: confirmedIntent.status,
                    orderId: confirmedIntent.metadata.orderId,
                };
            }

            return {
                status: paymentIntent.status,
                orderId: paymentIntent.metadata.orderId,
            };
        } catch (error) {
            console.error('Payment confirmation error:', error);
            throw new BadRequestException('Failed to confirm payment');
        }
    }

    async handleWebhook(signature: string, payload: Buffer) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

        if (!webhookSecret) {
            console.log('Webhook secret not configured, skipping verification');
            // In development without webhook secret, parse the event directly
            const event = JSON.parse(payload.toString());
            return this.processWebhookEvent(event);
        }

        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret,
            );

            return this.processWebhookEvent(event);
        } catch (error) {
            console.error('Webhook signature verification failed:', error);
            throw new BadRequestException('Invalid webhook signature');
        }
    }

    private async processWebhookEvent(event: Stripe.Event) {
        console.log(`Processing webhook event: ${event.type}`);

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await this.handleSuccessfulPayment(paymentIntent);
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object as Stripe.PaymentIntent;
                await this.handleFailedPayment(failedIntent);
                break;

            case 'charge.refunded':
                const charge = event.data.object as Stripe.Charge;
                await this.handleRefund(charge);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }

    private async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) {
            console.error('No orderId in payment intent metadata');
            return;
        }

        const order = await this.orderModel.findById(orderId);

        if (!order) {
            console.error(`Order ${orderId} not found`);
            return;
        }

        // Update order status only if it's still pending or processing
        if (order.paymentStatus === PaymentStatus.PENDING || order.paymentStatus === PaymentStatus.PROCESSING) {
            await this.orderModel.findByIdAndUpdate(orderId, {
                paymentStatus: PaymentStatus.COMPLETED,
                status: OrderStatus.CONFIRMED,
                paymentCompletedAt: new Date(),
                timeline: [
                    ...order.timeline,
                    {
                        status: OrderStatus.CONFIRMED,
                        timestamp: new Date(),
                        notes: 'Payment confirmed',
                    },
                ],
                updatedAt: new Date(),
            });

            console.log(`Order ${order.orderNumber} payment confirmed`);

            // Get the updated order with populated fields
            const updatedOrder = await this.orderModel
                .findById(orderId)
                .populate('userId', 'firstName lastName email phone')
                .exec();

            // Emit WebSocket events for payment completion
            this.wsGateway.notifyPaymentCompleted(updatedOrder);
            this.wsGateway.notifyOrderStatusChanged(updatedOrder);
        }
    }

    private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) return;

        await this.orderModel.findByIdAndUpdate(orderId, {
            paymentStatus: PaymentStatus.FAILED,
            paymentError: paymentIntent.last_payment_error?.message,
            updatedAt: new Date(),
        });

        console.log(`Payment failed for order ${orderId}`);

        // Get the updated order
        const order = await this.orderModel
            .findById(orderId)
            .populate('userId', 'firstName lastName email phone')
            .exec();

        // Emit WebSocket event for payment failure
        if (order) {
            this.wsGateway.emitToOrder(orderId, 'payment:failed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                error: paymentIntent.last_payment_error?.message,
            });

            // Notify the customer
            if (order.userId) {
                this.wsGateway.emitToUser(order.userId._id.toString(), 'payment:failed', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    error: paymentIntent.last_payment_error?.message,
                });
            }
        }
    }

    private async handleRefund(charge: Stripe.Charge) {
        const paymentIntentId = charge.payment_intent as string;

        const order = await this.orderModel.findOne({ paymentIntentId });

        if (!order) {
            console.error(`Order not found for payment intent ${paymentIntentId}`);
            return;
        }

        const refundAmount = charge.amount_refunded / 100; // Convert from cents

        await this.orderModel.findByIdAndUpdate(order._id, {
            paymentStatus: PaymentStatus.REFUNDED,
            refundAmount: refundAmount,
            refundedAt: new Date(),
            timeline: [
                ...order.timeline,
                {
                    status: 'refunded',
                    timestamp: new Date(),
                    notes: `Refunded $${refundAmount.toFixed(2)}`,
                },
            ],
            updatedAt: new Date(),
        });

        console.log(`Order ${order.orderNumber} refunded: $${refundAmount}`);

        // Get the updated order with populated fields
        const updatedOrder = await this.orderModel
            .findById(order._id)
            .populate('userId', 'firstName lastName email phone')
            .exec();

        // Emit WebSocket event for refund
        this.wsGateway.emitToOrder(order._id.toString(), 'payment:refunded', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            refundAmount: refundAmount,
        });

        // Notify the customer
        if (updatedOrder.userId) {
            this.wsGateway.emitToUser(updatedOrder.userId._id.toString(), 'payment:refunded', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                refundAmount: refundAmount,
                message: `Your order ${order.orderNumber} has been refunded $${refundAmount.toFixed(2)}`,
            });
        }
    }

    async createRefund(orderId: string, amount?: number, reason?: string) {
        const order = await this.orderModel.findById(orderId).exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (!order.paymentIntentId) {
            throw new BadRequestException('No payment found for this order');
        }

        if (order.paymentStatus !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Payment not completed');
        }

        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: order.paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
                reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
                metadata: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                },
            });

            return {
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                reason: refund.reason,
            };
        } catch (error) {
            console.error('Refund error:', error);
            throw new BadRequestException('Failed to process refund');
        }
    }
}