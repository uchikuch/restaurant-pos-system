// apps/api/src/menu-items/menu-items.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schemas/menu-item.schema';
import { CategoriesService } from '../categories/categories.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
    constructor(
        @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
        private categoriesService: CategoriesService,
    ) { }

    async create(createMenuItemDto: CreateMenuItemDto): Promise<MenuItemDocument> {
        try {
            // Verify category exists
            await this.categoriesService.findById(createMenuItemDto.categoryId);

            // Check if menu item with same name already exists in category
            const existingItem = await this.findByNameInCategory(
                createMenuItemDto.name,
                createMenuItemDto.categoryId
            );
            if (existingItem) {
                throw new ConflictException('Menu item with this name already exists in this category');
            }

            // Set default sort order if not provided
            if (createMenuItemDto.sortOrder === undefined) {
                const lastItem = await this.menuItemModel
                    .findOne({ categoryId: createMenuItemDto.categoryId })
                    .sort({ sortOrder: -1 })
                    .exec();
                createMenuItemDto.sortOrder = lastItem ? lastItem.sortOrder + 10 : 10;
            }

            // Generate unique IDs for customizations if not provided
            if (createMenuItemDto.customizations) {
                createMenuItemDto.customizations.forEach(customization => {
                    if (!customization.id) {
                        customization.id = new Types.ObjectId().toString();
                    }
                    customization.options.forEach(option => {
                        if (!option.id) {
                            option.id = new Types.ObjectId().toString();
                        }
                    });
                });
            }

            const menuItem = new this.menuItemModel(createMenuItemDto);
            const savedItem = await menuItem.save();

            // Update category item count
            await this.categoriesService.updateItemCount(createMenuItemDto.categoryId, 1);

            return savedItem;
        } catch (error) {
            if (error.code === 11000) {
                // MongoDB duplicate key error
                if (error.keyPattern.slug) {
                    throw new ConflictException('Menu item with this name already exists');
                }
            }
            throw error;
        }
    }

    async findAll(options: {
        categoryId?: string;
        includeInactive?: boolean;
        includeUnavailable?: boolean;
        featured?: boolean;
        dietary?: string[];
        tags?: string[];
        priceMin?: number;
        priceMax?: number;
        search?: string;
        sortBy?: 'name' | 'price' | 'rating' | 'popularity' | 'sortOrder';
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    } = {}): Promise<{
        items: MenuItemDocument[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const {
            categoryId,
            includeInactive = false,
            includeUnavailable = false,
            featured,
            dietary = [],
            tags = [],
            priceMin,
            priceMax,
            search,
            sortBy = 'sortOrder',
            sortOrder = 'asc',
            page = 1,
            limit = 20
        } = options;

        const filter: any = {};

        // Category filter
        if (categoryId) {
            filter.categoryId = categoryId;
        }

        // Active/Available filters
        if (!includeInactive) {
            filter.isActive = true;
        }
        if (!includeUnavailable) {
            filter.isAvailable = true;
        }

        // Featured filter
        if (featured !== undefined) {
            filter.isFeatured = featured;
        }

        // Dietary restrictions filter
        if (dietary.length > 0) {
            filter.dietaryRestrictions = { $in: dietary };
        }

        // Tags filter
        if (tags.length > 0) {
            filter.tags = { $in: tags };
        }

        // Price range filter
        if (priceMin !== undefined || priceMax !== undefined) {
            filter.basePrice = {};
            if (priceMin !== undefined) {
                filter.basePrice.$gte = priceMin;
            }
            if (priceMax !== undefined) {
                filter.basePrice.$lte = priceMax;
            }
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Sorting
        const sort: any = {};
        switch (sortBy) {
            case 'price':
                sort.basePrice = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'rating':
                sort.averageRating = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'popularity':
                sort.soldCount = sortOrder === 'asc' ? 1 : -1;
                break;
            case 'name':
                sort.name = sortOrder === 'asc' ? 1 : -1;
                break;
            default:
                sort.sortOrder = sortOrder === 'asc' ? 1 : -1;
        }

        // Add secondary sort by name for consistency
        if (sortBy !== 'name') {
            sort.name = 1;
        }

        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.menuItemModel
                .find(filter)
                .populate('categoryId', 'name slug')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.menuItemModel.countDocuments(filter)
        ]);

        return {
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findById(id: string): Promise<MenuItemDocument> {
        const menuItem = await this.menuItemModel
            .findById(id)
            .populate('categoryId', 'name slug')
            .exec();

        if (!menuItem) {
            throw new NotFoundException('Menu item not found');
        }

        return menuItem;
    }

    async findBySlug(slug: string): Promise<MenuItemDocument> {
        const menuItem = await this.menuItemModel
            .findOne({ slug, isActive: true, isAvailable: true })
            .populate('categoryId', 'name slug')
            .exec();

        if (!menuItem) {
            throw new NotFoundException('Menu item not found');
        }

        return menuItem;
    }

    async findByNameInCategory(name: string, categoryId: string): Promise<MenuItemDocument | null> {
        return await this.menuItemModel
            .findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                categoryId
            })
            .exec();
    }

    async update(id: string, updateMenuItemDto: UpdateMenuItemDto): Promise<MenuItemDocument> {
        const menuItem = await this.findById(id);

        // If category is being changed, verify new category exists
        if (updateMenuItemDto.categoryId && updateMenuItemDto.categoryId !== menuItem.categoryId.toString()) {
            await this.categoriesService.findById(updateMenuItemDto.categoryId);

            // Update item counts
            await this.categoriesService.updateItemCount(menuItem.categoryId.toString(), -1);
            await this.categoriesService.updateItemCount(updateMenuItemDto.categoryId, 1);
        }

        // Check if name is being changed and if new name already exists in category
        if (updateMenuItemDto.name && updateMenuItemDto.name !== menuItem.name) {
            const categoryId = updateMenuItemDto.categoryId || menuItem.categoryId.toString();
            const existingItem = await this.findByNameInCategory(updateMenuItemDto.name, categoryId);
            if (existingItem && existingItem.id !== id) {
                throw new ConflictException('Menu item with this name already exists in this category');
            }
        }

        // Generate IDs for new customizations
        if (updateMenuItemDto.customizations) {
            updateMenuItemDto.customizations.forEach(customization => {
                if (!customization.id) {
                    customization.id = new Types.ObjectId().toString();
                }
                customization.options.forEach(option => {
                    if (!option.id) {
                        option.id = new Types.ObjectId().toString();
                    }
                });
            });
        }

        const updatedMenuItem = await this.menuItemModel
            .findByIdAndUpdate(id, updateMenuItemDto, { new: true, runValidators: true })
            .populate('categoryId', 'name slug')
            .exec();

        if (!updatedMenuItem) {
            throw new NotFoundException('Menu item not found');
        }

        return updatedMenuItem;
    }

    async remove(id: string): Promise<void> {
        const menuItem = await this.findById(id);

        const result = await this.menuItemModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('Menu item not found');
        }

        // Update category item count
        await this.categoriesService.updateItemCount(menuItem.categoryId.toString(), -1);
    }

    async toggleActive(id: string): Promise<MenuItemDocument> {
        const menuItem = await this.findById(id);
        menuItem.isActive = !menuItem.isActive;
        return await menuItem.save();
    }

    async toggleAvailability(id: string): Promise<MenuItemDocument> {
        const menuItem = await this.findById(id);
        menuItem.isAvailable = !menuItem.isAvailable;
        return await menuItem.save();
    }

    async toggleFeatured(id: string): Promise<MenuItemDocument> {
        const menuItem = await this.findById(id);
        menuItem.isFeatured = !menuItem.isFeatured;
        return await menuItem.save();
    }

    async updateStock(id: string, quantity: number): Promise<MenuItemDocument> {
        const menuItem = await this.findById(id);

        if (!menuItem.trackInventory) {
            throw new BadRequestException('This item does not track inventory');
        }

        menuItem.stockQuantity = Math.max(0, quantity);

        // Auto-set unavailable if out of stock
        if (menuItem.stockQuantity === 0) {
            menuItem.isAvailable = false;
        }

        return await menuItem.save();
    }

    async incrementSoldCount(id: string, quantity: number = 1): Promise<void> {
        await this.menuItemModel
            .findByIdAndUpdate(id, { $inc: { soldCount: quantity } })
            .exec();
    }

    async updateRating(id: string, newRating: number, isNewReview: boolean = true): Promise<MenuItemDocument> {
        const menuItem = await this.findById(id);

        if (isNewReview) {
            // Calculate new average rating
            const totalRating = menuItem.averageRating * menuItem.reviewCount;
            menuItem.reviewCount += 1;
            menuItem.averageRating = (totalRating + newRating) / menuItem.reviewCount;
        } else {
            // Just update the average (when review is updated)
            menuItem.averageRating = newRating;
        }

        return await menuItem.save();
    }

    async getFeaturedItems(limit: number = 10): Promise<MenuItemDocument[]> {
        return await this.menuItemModel
            .find({
                isFeatured: true,
                isActive: true,
                isAvailable: true
            })
            .populate('categoryId', 'name slug')
            .sort({ soldCount: -1, averageRating: -1 })
            .limit(limit)
            .exec();
    }

    async getPopularItems(limit: number = 10): Promise<MenuItemDocument[]> {
        return await this.menuItemModel
            .find({
                isActive: true,
                isAvailable: true
            })
            .populate('categoryId', 'name slug')
            .sort({ soldCount: -1 })
            .limit(limit)
            .exec();
    }

    async getHighestRatedItems(limit: number = 10): Promise<MenuItemDocument[]> {
        return await this.menuItemModel
            .find({
                isActive: true,
                isAvailable: true,
                reviewCount: { $gte: 5 } // Only items with at least 5 reviews
            })
            .populate('categoryId', 'name slug')
            .sort({ averageRating: -1, reviewCount: -1 })
            .limit(limit)
            .exec();
    }

    async calculatePrice(
        menuItemId: string,
        selectedCustomizations: { customizationId: string; optionIds: string[] }[]
    ): Promise<{ basePrice: number; customizationTotal: number; totalPrice: number; breakdown: any[] }> {
        const menuItem = await this.findById(menuItemId);

        let customizationTotal = 0;
        const breakdown = [];

        for (const selection of selectedCustomizations) {
            const customization = menuItem.customizations.find(c => c.id === selection.customizationId);
            if (!customization) {
                throw new BadRequestException(`Customization ${selection.customizationId} not found`);
            }

            for (const optionId of selection.optionIds) {
                const option = customization.options.find(o => o.id === optionId);
                if (!option) {
                    throw new BadRequestException(`Option ${optionId} not found in customization ${customization.name}`);
                }

                if (!option.isAvailable) {
                    throw new BadRequestException(`Option ${option.name} is not available`);
                }

                customizationTotal += option.priceModifier;
                breakdown.push({
                    customization: customization.name,
                    option: option.name,
                    priceModifier: option.priceModifier
                });
            }
        }

        const totalPrice = menuItem.basePrice + customizationTotal;

        return {
            basePrice: menuItem.basePrice,
            customizationTotal,
            totalPrice,
            breakdown
        };
    }
}