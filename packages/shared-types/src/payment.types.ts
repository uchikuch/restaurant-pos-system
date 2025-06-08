// packages/shared-types/src/payment.ts

import { PaymentStatus } from "./common.types";

export interface PaymentIntent {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    orderId: string;
}

export type PaymentIntentStatus =
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';

export interface PaymentDetails {
    orderId: string;
    orderNumber: string;
    paymentStatus: PaymentStatus;
    total: number;
    paymentIntent?: {
        id: string;
        status: PaymentIntentStatus;
        amount: number;
        currency: string;
    };
    paidAt?: Date;
    refundId?: string;
    refundAmount?: number;
    refundedAt?: Date;
    paymentMethod?: string;
    paymentMethodLast4?: string;
}

export interface CreatePaymentIntentRequest {
    orderId: string;
}

export interface ConfirmPaymentRequest {
    paymentIntentId: string;
    paymentMethodId?: string;
}

export interface RefundRequest {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

export interface RefundResponse {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reason: string;
}