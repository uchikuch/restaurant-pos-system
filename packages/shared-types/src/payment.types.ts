import { PaymentStatus } from "./common.types";

export interface Payment {
    _id: string;
    orderId: string;
    stripePaymentIntentId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paymentMethod: {
        type: string;
        last4?: string;
        brand?: string;
    };
    refunds: PaymentRefund[];
    metadata: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaymentRefund {
    _id: string;
    stripeRefundId: string;
    amount: number;
    reason: string;
    status: 'pending' | 'succeeded' | 'failed';
    createdAt: Date;
}