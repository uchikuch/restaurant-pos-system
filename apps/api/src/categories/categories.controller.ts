// apps/api/src/categories/categories.controller.ts
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@restaurant-pos/shared-types';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    // Public endpoints for customers to browse categories

    @Public()
    @Get('public')
    async getPublicCategories(
        @Query('mealType') mealType?: 'breakfast' | 'lunch' | 'dinner' | 'lateNight'
    ) {
        return await this.categoriesService.getAvailableCategories(mealType);
    }

    @Public()
    @Get('public/search')
    async searchCategories(@Query('q') query: string) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        return await this.categoriesService.search(query.trim());
    }

    @Public()
    @Get('public/:slug')
    async getPublicCategoryBySlug(@Param('slug') slug: string) {
        return await this.categoriesService.findBySlug(slug);
    }

    // Admin-only endpoints for category management

    @Post()
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        return await this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async findAll(
        @Query('includeInactive') includeInactive?: string,
        @Query('includeUnavailable') includeUnavailable?: string,
        @Query('sortBy') sortBy?: 'name' | 'sortOrder' | 'createdAt',
        @Query('sortOrder') sortOrder?: 'asc' | 'desc'
    ) {
        return await this.categoriesService.findAll({
            includeInactive: includeInactive === 'true',
            includeUnavailable: includeUnavailable === 'true',
            sortBy: sortBy || 'sortOrder',
            sortOrder: sortOrder || 'asc'
        });
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async findOne(@Param('id') id: string) {
        return await this.categoriesService.findById(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto
    ) {
        return await this.categoriesService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.categoriesService.remove(id);
    }

    // Bulk operations

    @Patch('bulk/sort-order')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async updateSortOrder(
        @Body() categoryOrders: { id: string; sortOrder: number }[]
    ) {
        await this.categoriesService.updateSortOrder(categoryOrders);
        return { message: 'Sort order updated successfully' };
    }

    @Patch(':id/toggle-active')
    @Roles(UserRole.ADMIN)
    async toggleActive(@Param('id') id: string) {
        return await this.categoriesService.toggleActive(id);
    }

    @Patch(':id/toggle-availability')
    @Roles(UserRole.ADMIN)
    async toggleAvailability(@Param('id') id: string) {
        return await this.categoriesService.toggleAvailability(id);
    }

    @Post('recalculate-item-counts')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async recalculateItemCounts() {
        await this.categoriesService.recalculateItemCounts();
        return { message: 'Item counts recalculated successfully' };
    }

    @Get('with-item-counts')
    @Roles(UserRole.ADMIN)
    async getCategoriesWithItemCounts() {
        return await this.categoriesService.getCategoriesWithItemCounts();
    }

    @Post(':fromId/move-items/:toId')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async moveMenuItems(
        @Param('fromId') fromId: string,
        @Param('toId') toId: string
    ) {
        const result = await this.categoriesService.moveMenuItems(fromId, toId);
        return {
            message: `Successfully moved ${result.movedCount} menu items`,
            movedCount: result.movedCount
        };
    }
}