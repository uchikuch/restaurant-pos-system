import { Order } from "./order.types";

export interface DashboardStats {
    today: {
        orders: number;
        revenue: number;
        averageOrderValue: number;
        newCustomers: number;
    };
    thisWeek: {
        orders: number;
        revenue: number;
        averageOrderValue: number;
        newCustomers: number;
    };
    thisMonth: {
        orders: number;
        revenue: number;
        averageOrderValue: number;
        newCustomers: number;
    };
    popularItems: PopularItem[];
    recentOrders: Order[];
}

export interface PopularItem {
    menuItemId: string;
    name: string;
    orderCount: number;
    revenue: number;
}

export interface RevenueAnalytics {
    period: 'day' | 'week' | 'month' | 'year';
    data: {
        date: string;
        revenue: number;
        orders: number;
        averageOrderValue: number;
    }[];
}