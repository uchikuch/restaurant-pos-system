import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@restaurant-pos/shared-types';
import { EarnPointsDto, RedeemPointsDto, AddBonusPointsDto, LoyaltyQueryDto } from './dto/loyalty.dto';

@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
    constructor(private readonly loyaltyService: LoyaltyService) { }

    // Customer endpoints
    @Get('account')
    @Roles(UserRole.CUSTOMER)
    async getMyAccount(@Request() req) {
        const account = await this.loyaltyService.getAccount(req.user.id);
        const nextTierInfo = await this.loyaltyService.getPointsRequiredForNextTier(req.user.id);

        return {
            success: true,
            data: {
                ...account.toObject(),
                nextTierInfo
            }
        };
    }

    @Get('transactions')
    @Roles(UserRole.CUSTOMER)
    async getMyTransactions(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('type') type?: 'earned' | 'redeemed' | 'expired' | 'bonus',
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc'
    ) {
        const query: LoyaltyQueryDto = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            type,
            startDate,
            endDate,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc'
        };

        const result = await this.loyaltyService.getTransactions(req.user.id, query);

        return {
            success: true,
            data: {
                transactions: result.transactions,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: result.total,
                    pages: result.pages
                }
            }
        };
    }

    @Post('earn')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async earnPoints(@Request() req, @Body() earnPointsDto: EarnPointsDto) {
        const account = await this.loyaltyService.earnPoints(req.user.id, earnPointsDto);

        return {
            success: true,
            message: 'Points earned successfully',
            data: account
        };
    }

    @Post('redeem')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async redeemPoints(@Request() req, @Body() redeemPointsDto: RedeemPointsDto) {
        const account = await this.loyaltyService.redeemPoints(req.user.id, redeemPointsDto);
        const redemptionValue = await this.loyaltyService.calculateRedemptionValue(redeemPointsDto.points);

        return {
            success: true,
            message: `Successfully redeemed ${redeemPointsDto.points} points for $${redemptionValue.toFixed(2)}`,
            data: {
                account,
                redemptionValue
            }
        };
    }

    @Get('redemption-value/:points')
    @Roles(UserRole.CUSTOMER)
    async getRedemptionValue(@Param('points') points: string) {
        const pointsNumber = parseInt(points);
        const value = await this.loyaltyService.calculateRedemptionValue(pointsNumber);

        return {
            success: true,
            data: {
                points: pointsNumber,
                value,
                formatted: `$${value.toFixed(2)}`
            }
        };
    }

    // Admin endpoints
    @Get('stats')
    @Roles(UserRole.ADMIN)
    async getLoyaltyStats() {
        const stats = await this.loyaltyService.getLoyaltyStats();

        return {
            success: true,
            data: stats
        };
    }

    @Post('bonus')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async addBonusPoints(@Body() addBonusDto: AddBonusPointsDto) {
        const account = await this.loyaltyService.addBonusPoints(addBonusDto);

        return {
            success: true,
            message: 'Bonus points added successfully',
            data: account
        };
    }

    @Get('account/:userId')
    @Roles(UserRole.ADMIN)
    async getUserAccount(@Param('userId') userId: string) {
        const account = await this.loyaltyService.getAccount(userId);
        const nextTierInfo = await this.loyaltyService.getPointsRequiredForNextTier(userId);

        return {
            success: true,
            data: {
                ...account.toObject(),
                nextTierInfo
            }
        };
    }

    @Post('test-bonus/:points')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async addTestBonus(@Request() req, @Param('points') points: string) {
        const pointsNumber = parseInt(points);
        const account = await this.loyaltyService.addTestBonus(req.user.id, pointsNumber);

        return {
            success: true,
            message: `Added ${pointsNumber} test bonus points`,
            data: account
        };
    }
}