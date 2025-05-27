import { User } from "./user.types";

export interface LoyaltyAccount {
    _id: string;
    userId: string;
    user?: User;
    totalPoints: number;
    pointsEarned: number;
    pointsUsed: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    tierProgress: number; // Progress to next tier (0-100)
    transactions: LoyaltyTransaction[];
    createdAt: Date;
    updatedAt: Date;
}

export interface LoyaltyTransaction {
    _id: string;
    type: 'earned' | 'redeemed' | 'expired' | 'bonus';
    points: number;
    orderId?: string;
    description: string;
    expiresAt?: Date;
    createdAt: Date;
}

export interface LoyaltyReward {
    _id: string;
    name: string;
    description: string;
    pointsCost: number;
    rewardType: 'discount_percent' | 'discount_fixed' | 'free_item' | 'free_delivery';
    rewardValue: number; // Percentage, dollar amount, or item ID
    minimumOrderValue?: number;
    maxRedemptions?: number;
    currentRedemptions: number;
    isActive: boolean;
    validFrom: Date;
    validUntil: Date;
    createdAt: Date;
    updatedAt: Date;
}
