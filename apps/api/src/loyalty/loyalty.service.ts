import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { EarnPointsDto, RedeemPointsDto, AddBonusPointsDto, LoyaltyQueryDto } from './dto/loyalty.dto';
import { LoyaltyAccount, LoyaltyAccountDocument } from './schemas/loyalty.schema';

interface LoyaltyConfig {
    pointsPerDollar: number;
    tierThresholds: {
        bronze: number;
        silver: number;
        gold: number;
        platinum: number;
    };
    tierMultipliers: {
        bronze: number;
        silver: number;
        gold: number;
        platinum: number;
    };
    pointExpirationDays: number;
    redemptionValue: number; // dollars per 100 points
}

@Injectable()
export class LoyaltyService {
    private readonly config: LoyaltyConfig = {
        pointsPerDollar: 10, // 10 points per $1 spent
        tierThresholds: {
            bronze: 0,
            silver: 500,
            gold: 1500,
            platinum: 3000
        },
        tierMultipliers: {
            bronze: 1.0,
            silver: 1.2,
            gold: 1.5,
            platinum: 2.0
        },
        pointExpirationDays: 365, // Points expire after 1 year
        redemptionValue: 1.0 // $1 off per 100 points
    };

    constructor(
        @InjectModel(LoyaltyAccount.name) private loyaltyModel: Model<LoyaltyAccountDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    ) { }

    async findOrCreateAccount(userId: string): Promise<LoyaltyAccountDocument> {
        let account = await this.loyaltyModel.findOne({ userId: new Types.ObjectId(userId) });

        if (!account) {
            account = new this.loyaltyModel({
                userId: new Types.ObjectId(userId),
                totalPoints: 0,
                pointsEarned: 0,
                pointsUsed: 0,
                tier: 'bronze',
                tierProgress: 0,
                transactions: []
            });
            await account.save();
        }

        return account;
    }

    async getAccount(userId: string): Promise<LoyaltyAccountDocument> {
        const account = await this.loyaltyModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .populate('userId', 'firstName lastName email')
            .exec();

        if (!account) {
            return await this.findOrCreateAccount(userId);
        }

        // Clean up expired points
        await this.cleanupExpiredPoints(account);

        return account;
    }

    async earnPoints(userId: string, earnPointsDto: EarnPointsDto): Promise<LoyaltyAccountDocument> {
        const account = await this.findOrCreateAccount(userId);

        // Validate order exists and belongs to user
        const order = await this.orderModel.findById(earnPointsDto.orderId);
        if (!order || order.userId.toString() !== userId) {
            throw new BadRequestException('Order not found or does not belong to user');
        }

        // Calculate base points
        const basePoints = Math.floor(earnPointsDto.amount * this.config.pointsPerDollar);

        // Apply tier multiplier
        const tierMultiplier = this.config.tierMultipliers[account.tier];
        const earnedPoints = Math.floor(basePoints * tierMultiplier);

        // Add transaction - Fix: Ensure all properties have correct types
        const transaction = {
            type: 'earned' as const,
            points: earnedPoints,
            orderId: new Types.ObjectId(earnPointsDto.orderId),
            description: `Earned ${earnedPoints} points from order #${order.orderNumber}`,
            expiresAt: new Date(Date.now() + this.config.pointExpirationDays * 24 * 60 * 60 * 1000),
            createdAt: new Date()
        };

        account.transactions.push(transaction);
        account.totalPoints += earnedPoints;
        account.pointsEarned += earnedPoints;

        // Update tier and progress
        await this.updateTierAndProgress(account);

        await account.save();
        return account;
    }

    async redeemPoints(userId: string, redeemPointsDto: RedeemPointsDto): Promise<LoyaltyAccountDocument> {
        const account = await this.findOrCreateAccount(userId);

        // Check if user has enough points
        const availablePoints = await this.getAvailablePoints(account);
        if (availablePoints < redeemPointsDto.points) {
            throw new BadRequestException(`Insufficient points. Available: ${availablePoints}, Requested: ${redeemPointsDto.points}`);
        }

        // Add redemption transaction - Fix: Ensure proper types
        const transaction = {
            type: 'redeemed' as const,
            points: -redeemPointsDto.points,
            orderId: redeemPointsDto.orderId ? new Types.ObjectId(redeemPointsDto.orderId) : undefined,
            description: redeemPointsDto.description || `Redeemed ${redeemPointsDto.points} points`,
            createdAt: new Date()
            // Note: redemption transactions don't have expiresAt
        };

        account.transactions.push(transaction);
        account.totalPoints -= redeemPointsDto.points;
        account.pointsUsed += redeemPointsDto.points;

        await account.save();
        return account;
    }

    async addBonusPoints(addBonusDto: AddBonusPointsDto): Promise<LoyaltyAccountDocument> {
        const account = await this.findOrCreateAccount(addBonusDto.userId);

        // Fix: Ensure expiresAt is always a Date object
        const expiresAt = addBonusDto.expiresAt
            ? new Date(addBonusDto.expiresAt)
            : new Date(Date.now() + this.config.pointExpirationDays * 24 * 60 * 60 * 1000);

        const transaction = {
            type: 'bonus' as const,
            points: addBonusDto.points,
            description: addBonusDto.description,
            expiresAt: expiresAt,
            createdAt: new Date()
        };

        account.transactions.push(transaction);
        account.totalPoints += addBonusDto.points;
        account.pointsEarned += addBonusDto.points;

        // Update tier and progress
        await this.updateTierAndProgress(account);

        await account.save();
        return account;
    }

    async getTransactions(userId: string, query: LoyaltyQueryDto): Promise<{
        transactions: any[];
        total: number;
        pages: number;
    }> {
        const account = await this.findOrCreateAccount(userId);

        let transactions = [...account.transactions];

        // Filter by type
        if (query.type) {
            transactions = transactions.filter(t => t.type === query.type);
        }

        // Filter by date range
        if (query.startDate || query.endDate) {
            transactions = transactions.filter(t => {
                const transactionDate = new Date(t.createdAt);
                if (query.startDate && transactionDate < new Date(query.startDate)) return false;
                if (query.endDate && transactionDate > new Date(query.endDate)) return false;
                return true;
            });
        }

        // Sort
        transactions.sort((a, b) => {
            const aValue = a[query.sortBy] || a.createdAt;
            const bValue = b[query.sortBy] || b.createdAt;

            if (query.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // Paginate
        const total = transactions.length;
        const pages = Math.ceil(total / query.limit);
        const skip = (query.page - 1) * query.limit;
        const paginatedTransactions = transactions.slice(skip, skip + query.limit);

        return {
            transactions: paginatedTransactions,
            total,
            pages
        };
    }

    async calculateRedemptionValue(points: number): Promise<number> {
        return (points / 100) * this.config.redemptionValue;
    }

    async getPointsRequiredForNextTier(userId: string): Promise<{ nextTier: string; pointsRequired: number } | null> {
        const account = await this.findOrCreateAccount(userId);
        const currentTier = account.tier;

        const tiers = ['bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = tiers.indexOf(currentTier);

        if (currentIndex === tiers.length - 1) {
            return null; // Already at highest tier
        }

        const nextTier = tiers[currentIndex + 1];
        const pointsRequired = this.config.tierThresholds[nextTier] - account.pointsEarned;

        return {
            nextTier,
            pointsRequired: Math.max(0, pointsRequired)
        };
    }

    async getLoyaltyStats(): Promise<any> {
        const stats = await this.loyaltyModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalAccounts: { $sum: 1 },
                    totalPointsIssued: { $sum: '$pointsEarned' },
                    totalPointsRedeemed: { $sum: '$pointsUsed' },
                    averagePoints: { $avg: '$totalPoints' }
                }
            }
        ]);

        const tierDistribution = await this.loyaltyModel.aggregate([
            {
                $group: {
                    _id: '$tier',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            ...stats[0],
            tierDistribution: tierDistribution.reduce((acc, tier) => {
                acc[tier._id] = tier.count;
                return acc;
            }, {})
        };
    }

    // Private helper methods
    private async updateTierAndProgress(account: LoyaltyAccountDocument): Promise<void> {
        const pointsEarned = account.pointsEarned;

        let newTier = 'bronze';
        if (pointsEarned >= this.config.tierThresholds.platinum) {
            newTier = 'platinum';
        } else if (pointsEarned >= this.config.tierThresholds.gold) {
            newTier = 'gold';
        } else if (pointsEarned >= this.config.tierThresholds.silver) {
            newTier = 'silver';
        }

        account.tier = newTier;

        // Calculate progress to next tier
        const tiers = ['bronze', 'silver', 'gold', 'platinum'];
        const currentIndex = tiers.indexOf(newTier);

        if (currentIndex < tiers.length - 1) {
            const nextTier = tiers[currentIndex + 1];
            const currentTierThreshold = this.config.tierThresholds[newTier];
            const nextTierThreshold = this.config.tierThresholds[nextTier];
            const progress = ((pointsEarned - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100;
            account.tierProgress = Math.min(Math.max(progress, 0), 100);
        } else {
            account.tierProgress = 100; // Max tier reached
        }
    }

    private async getAvailablePoints(account: LoyaltyAccountDocument): Promise<number> {
        const now = new Date();
        return account.transactions
            .filter(t => t.type === 'earned' || t.type === 'bonus')
            .filter(t => !t.expiresAt || t.expiresAt > now)
            .reduce((sum, t) => sum + t.points, 0) - account.pointsUsed;
    }

    private async cleanupExpiredPoints(account: LoyaltyAccountDocument): Promise<void> {
        const now = new Date();
        const expiredTransactions = account.transactions.filter(
            t => (t.type === 'earned' || t.type === 'bonus') && t.expiresAt && t.expiresAt <= now
        );

        if (expiredTransactions.length > 0) {
            const expiredPoints = expiredTransactions.reduce((sum, t) => sum + t.points, 0);

            // Add expiration transaction - Fix: Ensure proper types
            const expirationTransaction = {
                type: 'expired' as const,
                points: -expiredPoints,
                description: `${expiredPoints} points expired`,
                createdAt: new Date()
                // Note: expiration transactions don't have expiresAt or orderId
            };

            account.transactions.push(expirationTransaction);
            account.totalPoints -= expiredPoints;

            await account.save();
        }
    }

    async addTestBonus(userId: string, points: number): Promise<LoyaltyAccountDocument> {
        return this.addBonusPoints({
            userId,
            points,
            description: `Test bonus: ${points} points`,
            // Don't specify expiresAt to use default
        });
    }
}
