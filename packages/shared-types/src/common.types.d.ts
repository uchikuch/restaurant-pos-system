export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginationResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare enum UserRole {
    CUSTOMER = "customer",
    KITCHEN_STAFF = "kitchen_staff",
    ADMIN = "admin"
}
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    READY = "ready",
    OUT_FOR_DELIVERY = "out_for_delivery",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIALLY_REFUNDED = "partially_refunded"
}
