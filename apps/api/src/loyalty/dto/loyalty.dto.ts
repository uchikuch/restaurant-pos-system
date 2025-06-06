// apps/api/src/loyalty/dto/loyalty.dto.ts - Updated with proper validation

import { IsString, IsNumber, IsOptional, IsPositive, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class EarnPointsDto {
    @IsString()
    orderId: string;

    @IsNumber()
    @IsPositive()
    amount: number;
}

export class RedeemPointsDto {
    @IsInt()
    @IsPositive()
    points: number;

    @IsOptional()
    @IsString()
    orderId?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class AddBonusPointsDto {
    @IsString()
    userId: string;

    @IsInt()
    @IsPositive()
    points: number;

    @IsString()
    description: string;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export class LoyaltyQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(['earned', 'redeemed', 'expired', 'bonus'])
    type?: 'earned' | 'redeemed' | 'expired' | 'bonus';

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';
}

export class LoyaltyResponseDto {
    _id: string;
    userId: string;
    totalPoints: number;
    pointsEarned: number;
    pointsUsed: number;
    tier: string;
    tierProgress: number;
    nextTierPoints?: number;
    transactions: LoyaltyTransactionResponseDto[];
    createdAt: Date;
    updatedAt: Date;
}

export class LoyaltyTransactionResponseDto {
    type: string;
    points: number;
    orderId?: string;
    description: string;
    expiresAt?: Date;
    createdAt: Date;
}