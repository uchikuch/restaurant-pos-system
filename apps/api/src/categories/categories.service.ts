// apps/api/src/categories/categories.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    ) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
        try {
            // Check if category with same name already exists
            const existingCategory = await this.findByName(createCategoryDto.name);
            if (existingCategory) {
                throw new ConflictException('Category with this name already exists');
            }

            // Set default sort order if not provided
            if (createCategoryDto.sortOrder === undefined) {
                const lastCategory = await this.categoryModel
                    .findOne()
                    .sort({ sortOrder: -1 })
                    .exec();
                createCategoryDto.sortOrder = lastCategory ? lastCategory.sortOrder + 10 : 10;
            }

            const category = new this.categoryModel(createCategoryDto);
            return await category.save();
        } catch (error) {
            if (error.code === 11000) {
                // MongoDB duplicate key error
                if (error.keyPattern.slug) {
                    throw new ConflictException('Category with this name already exists');
                }
            }
            throw error;
        }
    }

    async findAll(options: {
        includeInactive?: boolean;
        includeUnavailable?: boolean;
        sortBy?: 'name' | 'sortOrder' | 'createdAt';
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<CategoryDocument[]> {
        const {
            includeInactive = false,
            includeUnavailable = false,
            sortBy = 'sortOrder',
            sortOrder = 'asc'
        } = options;

        const filter: any = {};

        if (!includeInactive) {
            filter.isActive = true;
        }

        if (!includeUnavailable) {
            filter.isAvailable = true;
        }

        const sort: any = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        return await this.categoryModel
            .find(filter)
            .sort(sort)
            .exec();
    }

    async findById(id: string): Promise<CategoryDocument> {
        const category = await this.categoryModel.findById(id).exec();
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }

    async findBySlug(slug: string): Promise<CategoryDocument> {
        const category = await this.categoryModel.findOne({ slug }).exec();
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }

    async findByName(name: string): Promise<CategoryDocument | null> {
        return await this.categoryModel
            .findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
            .exec();
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument> {
        const category = await this.findById(id);

        // Check if name is being changed and if new name already exists
        if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
            const existingCategory = await this.findByName(updateCategoryDto.name);
            if (existingCategory && existingCategory.id !== id) {
                throw new ConflictException('Category with this name already exists');
            }
        }

        const updatedCategory = await this.categoryModel
            .findByIdAndUpdate(id, updateCategoryDto, { new: true, runValidators: true })
            .exec();

        if (!updatedCategory) {
            throw new NotFoundException('Category not found');
        }

        return updatedCategory;
    }

    async remove(id: string): Promise<void> {
        // First check if category has any menu items
        const menuItemCount = await this.getMenuItemCount(id);
        if (menuItemCount > 0) {
            throw new BadRequestException(
                `Cannot delete category. It has ${menuItemCount} menu item(s). Please move or delete the menu items first.`
            );
        }

        const result = await this.categoryModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Category not found');
        }
    }

    async updateSortOrder(categoryOrders: { id: string; sortOrder: number }[]): Promise<void> {
        const bulkOps = categoryOrders.map(({ id, sortOrder }) => ({
            updateOne: {
                filter: { _id: id },
                update: { sortOrder }
            }
        }));

        await this.categoryModel.bulkWrite(bulkOps);
    }

    async toggleActive(id: string): Promise<CategoryDocument> {
        const category = await this.findById(id);
        category.isActive = !category.isActive;
        return await category.save();
    }

    async toggleAvailability(id: string): Promise<CategoryDocument> {
        const category = await this.findById(id);
        category.isAvailable = !category.isAvailable;
        return await category.save();
    }

    async search(query: string): Promise<CategoryDocument[]> {
        return await this.categoryModel
            .find({
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { name: { $regex: query, $options: 'i' } },
                            { description: { $regex: query, $options: 'i' } },
                            { tags: { $in: [new RegExp(query, 'i')] } }
                        ]
                    }
                ]
            })
            .sort({ sortOrder: 1 })
            .exec();
    }

    async getAvailableCategories(
        mealType?: 'breakfast' | 'lunch' | 'dinner' | 'lateNight'
    ): Promise<CategoryDocument[]> {
        const filter: any = {
            isActive: true,
            isAvailable: true
        };

        if (mealType) {
            filter[`availability.${mealType}`] = true;
        }

        return await this.categoryModel
            .find(filter)
            .sort({ sortOrder: 1 })
            .exec();
    }

    async updateItemCount(categoryId: string, increment: number = 1): Promise<void> {
        await this.categoryModel
            .findByIdAndUpdate(categoryId, { $inc: { itemCount: increment } })
            .exec();
    }

    async recalculateItemCounts(): Promise<void> {
        // Get all categories
        const categories = await this.categoryModel.find().exec();

        // For each category, count actual menu items and update the count
        for (const category of categories) {
            const actualCount = await this.getMenuItemCount(category.id);
            await this.categoryModel
                .findByIdAndUpdate(category.id, { itemCount: actualCount })
                .exec();
        }
    }

    // Helper method to get menu item count for a category
    private async getMenuItemCount(categoryId: string): Promise<number> {
        // We need to import MenuItem model here to count items
        // This creates a circular dependency, so we'll use direct model access
        const mongoose = require('mongoose');
        const MenuItemModel = mongoose.model('MenuItem');

        if (!MenuItemModel) {
            // If MenuItem model is not yet available, return 0
            return 0;
        }

        return await MenuItemModel.countDocuments({ categoryId }).exec();
    }

    // New method to get categories with their menu item counts
    async getCategoriesWithItemCounts(): Promise<(CategoryDocument & { actualItemCount: number })[]> {
        const categories = await this.findAll();
        const categoriesWithCounts = [];

        for (const category of categories) {
            const actualItemCount = await this.getMenuItemCount(category.id);
            categoriesWithCounts.push({
                ...category.toObject(),
                actualItemCount
            });
        }

        return categoriesWithCounts;
    }

    // Method to move all menu items from one category to another
    async moveMenuItems(fromCategoryId: string, toCategoryId: string): Promise<{ movedCount: number }> {
        // Verify both categories exist
        await this.findById(fromCategoryId);
        await this.findById(toCategoryId);

        const mongoose = require('mongoose');
        const MenuItemModel = mongoose.model('MenuItem');

        if (!MenuItemModel) {
            throw new BadRequestException('MenuItem model not available');
        }

        // Move all menu items
        const result = await MenuItemModel.updateMany(
            { categoryId: fromCategoryId },
            { categoryId: toCategoryId }
        ).exec();

        // Update item counts
        await this.updateItemCount(fromCategoryId, -result.modifiedCount);
        await this.updateItemCount(toCategoryId, result.modifiedCount);

        return { movedCount: result.modifiedCount };
    }
}