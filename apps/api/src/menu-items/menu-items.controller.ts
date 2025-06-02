// apps/api/src/menu-items/menu-items.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@restaurant-pos/shared-types';

@Controller('menu-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuItemsController {
    constructor(private readonly menuItemsService: MenuItemsService) { }

    // Public endpoints for customers to browse menu items

    @Public()
    @Get('public')
    async getPublicMenuItems(
        @Query('categoryId') categoryId?: string,
        @Query('featured') featured?: string,
        @Query('dietary') dietary?: string,
        @Query('tags') tags?: string,
        @Query('priceMin') priceMin?: string,
        @Query('priceMax') priceMax?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: 'name' | 'price' | 'rating' | 'popularity',
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const dietaryArray = dietary ? dietary.split(',') : [];
        const tagsArray = tags ? tags.split(',') : [];

        return await this.menuItemsService.findAll({
            categoryId,
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
            dietary: dietaryArray,
            tags: tagsArray,
            priceMin: priceMin ? parseFloat(priceMin) : undefined,
            priceMax: priceMax ? parseFloat(priceMax) : undefined,
            search,
            sortBy: sortBy || 'sortOrder',
            sortOrder: sortOrder || 'asc',
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
    }

    @Public()
    @Get('public/featured')
    async getFeaturedItems(@Query('limit') limit?: string) {
        return await this.menuItemsService.getFeaturedItems(limit ? parseInt(limit) : 10);
    }

    @Public()
    @Get('public/popular')
    async getPopularItems(@Query('limit') limit?: string) {
        return await this.menuItemsService.getPopularItems(limit ? parseInt(limit) : 10);
    }

    @Public()
    @Get('public/top-rated')
    async getHighestRatedItems(@Query('limit') limit?: string) {
        return await this.menuItemsService.getHighestRatedItems(limit ? parseInt(limit) : 10);
    }

    @Public()
    @Get('public/:slug')
    async getPublicMenuItemBySlug(@Param('slug') slug: string) {
        return await this.menuItemsService.findBySlug(slug);
    }

    @Public()
    @Post('public/calculate-price')
    @HttpCode(HttpStatus.OK)
    async calculatePrice(
        @Body() priceCalculation: {
            menuItemId: string;
            customizations: { customizationId: string; optionIds: string[] }[];
        }
    ) {
        return await this.menuItemsService.calculatePrice(
            priceCalculation.menuItemId,
            priceCalculation.customizations
        );
    }

    // Admin-only endpoints for menu item management

    @Post()
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createMenuItemDto: CreateMenuItemDto) {
        return await this.menuItemsService.create(createMenuItemDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async findAll(
        @Query('categoryId') categoryId?: string,
        @Query('includeInactive') includeInactive?: string,
        @Query('includeUnavailable') includeUnavailable?: string,
        @Query('featured') featured?: string,
        @Query('dietary') dietary?: string,
        @Query('tags') tags?: string,
        @Query('priceMin') priceMin?: string,
        @Query('priceMax') priceMax?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: 'name' | 'price' | 'rating' | 'popularity' | 'sortOrder',
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const dietaryArray = dietary ? dietary.split(',') : [];
        const tagsArray = tags ? tags.split(',') : [];

        return await this.menuItemsService.findAll({
            categoryId,
            includeInactive: includeInactive === 'true',
            includeUnavailable: includeUnavailable === 'true',
            featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
            dietary: dietaryArray,
            tags: tagsArray,
            priceMin: priceMin ? parseFloat(priceMin) : undefined,
            priceMax: priceMax ? parseFloat(priceMax) : undefined,
            search,
            sortBy: sortBy || 'sortOrder',
            sortOrder: sortOrder || 'asc',
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async findOne(@Param('id') id: string) {
        return await this.menuItemsService.findById(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() updateMenuItemDto: UpdateMenuItemDto
    ) {
        return await this.menuItemsService.update(id, updateMenuItemDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.menuItemsService.remove(id);
    }

    // Toggle operations

    @Patch(':id/toggle-active')
    @Roles(UserRole.ADMIN)
    async toggleActive(@Param('id') id: string) {
        return await this.menuItemsService.toggleActive(id);
    }

    @Patch(':id/toggle-availability')
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async toggleAvailability(@Param('id') id: string) {
        return await this.menuItemsService.toggleAvailability(id);
    }

    @Patch(':id/toggle-featured')
    @Roles(UserRole.ADMIN)
    async toggleFeatured(@Param('id') id: string) {
        return await this.menuItemsService.toggleFeatured(id);
    }

    // Inventory management

    @Patch(':id/stock')
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async updateStock(
        @Param('id') id: string,
        @Body() stockUpdate: { quantity: number }
    ) {
        return await this.menuItemsService.updateStock(id, stockUpdate.quantity);
    }

    @Patch(':id/sold')
    @Roles(UserRole.KITCHEN_STAFF, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async incrementSoldCount(
        @Param('id') id: string,
        @Body() soldUpdate: { quantity?: number }
    ) {
        await this.menuItemsService.incrementSoldCount(id, soldUpdate.quantity || 1);
        return { message: 'Sold count updated successfully' };
    }

    // Rating management

    @Patch(':id/rating')
    @Roles(UserRole.ADMIN)
    async updateRating(
        @Param('id') id: string,
        @Body() ratingUpdate: { rating: number; isNewReview?: boolean }
    ) {
        return await this.menuItemsService.updateRating(
            id,
            ratingUpdate.rating,
            ratingUpdate.isNewReview ?? true
        );
    }
}