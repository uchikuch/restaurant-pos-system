// apps/api/src/orders/order.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { MenuItem, MenuItemDocument } from '../menu-items/schemas/menu-item.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { OrderStatus, PaymentStatus, UserRole } from '@restaurant-pos/shared-types';
import { CreateOrderDto } from './dto/create-order.dto';
import { CustomerOrderQueryDto, KitchenOrderQueryDto, OrderQueryDto } from './dto/order-query.dto';
import { AssignStaffDto, OrderRatingDto, UpdateOrderDto, UpdateOrderStatusDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(createOrderDto: CreateOrderDto, userId: string): Promise<OrderDocument> {
        // Validate user exists
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Validate and calculate order
        const { items, pricing } = await this.validateAndCalculateOrder(createOrderDto);

        // Validate delivery address for delivery orders
        if (createOrderDto.orderType === 'delivery' && !createOrderDto.deliveryAddress) {
            throw new BadRequestException('Delivery address is required for delivery orders');
        }

        // Calculate estimated prep time
        const estimatedPrepTime = this.calculateEstimatedPrepTime(items, createOrderDto.orderType);

        // Create order
        const order = new this.orderModel({
            userId: new Types.ObjectId(userId),
            items,
            subtotal: pricing.subtotal,
            tax: pricing.tax,
            tip: createOrderDto.tip || 0,
            deliveryFee: pricing.deliveryFee,
            discount: pricing.discount,
            total: pricing.total,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            orderType: createOrderDto.orderType,
            deliveryAddress: createOrderDto.deliveryAddress,
            specialInstructions: createOrderDto.specialInstructions,
            estimatedPrepTime,
            scheduledFor: createOrderDto.scheduledFor ? new Date(createOrderDto.scheduledFor) : undefined,
            loyaltyPointsUsed: createOrderDto.loyaltyPointsToUse || 0,
            timeline: [{
                status: OrderStatus.PENDING,
                timestamp: new Date(),
                notes: 'Order created'
            }]
        });

        const savedOrder = await order.save();

        // Update menu item sold counts
        await this.updateMenuItemSoldCounts(items);

        return this.findById(savedOrder._id.toString());
    }

    async findAll(query: OrderQueryDto, userRole: UserRole, currentUserId?: string): Promise<{ orders: OrderDocument[], total: number, pages: number }> {
        const filter: any = {};

        // Role-based filtering
        if (userRole === UserRole.CUSTOMER && currentUserId) {
            filter.userId = new Types.ObjectId(currentUserId);
        }

        // Apply filters
        if (query.status) filter.status = query.status;
        if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
        if (query.orderType) filter.orderType = query.orderType;
        if (query.userId) filter.userId = new Types.ObjectId(query.userId);
        if (query.assignedToStaff) filter.assignedToStaff = new Types.ObjectId(query.assignedToStaff);
        if (query.orderNumber) filter.orderNumber = { $regex: query.orderNumber, $options: 'i' };

        // Date range filtering
        if (query.startDate || query.endDate) {
            filter.createdAt = {};
            if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
            if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
        }

        // Search functionality
        if (query.search) {
            filter.$or = [
                { orderNumber: { $regex: query.search, $options: 'i' } },
                { 'items.name': { $regex: query.search, $options: 'i' } }
            ];
        }

        const sort: any = {};
        sort[query.sortBy || 'createdAt'] = query.sortOrder === 'asc' ? 1 : -1;

        const skip = (query.page - 1) * query.limit;
        const limit = query.limit;

        const [orders, total] = await Promise.all([
            this.orderModel
                .find(filter)
                .populate('userId', 'firstName lastName email phone')
                .populate('assignedToStaff', 'firstName lastName')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.orderModel.countDocuments(filter)
        ]);

        return {
            orders,
            total,
            pages: Math.ceil(total / limit)
        };
    }

    async findKitchenOrders(query: KitchenOrderQueryDto): Promise<{ orders: OrderDocument[], total: number }> {
        const filter: any = {
            status: { $in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] }
        };

        if (query.status) filter.status = query.status;
        if (query.orderType) filter.orderType = query.orderType;
        if (query.assignedToStaff) filter.assignedToStaff = new Types.ObjectId(query.assignedToStaff);

        const sort: any = {};
        sort[query.sortBy || 'createdAt'] = query.sortOrder === 'asc' ? 1 : -1;

        const skip = (query.page - 1) * query.limit;
        const limit = query.limit;

        const [orders, total] = await Promise.all([
            this.orderModel
                .find(filter)
                .populate('assignedToStaff', 'firstName lastName')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.orderModel.countDocuments(filter)
        ]);

        return { orders, total };
    }

    async findById(id: string): Promise<OrderDocument> {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid order ID');
        }

        const order = await this.orderModel
            .findById(id)
            .populate('userId', 'firstName lastName email phone')
            .populate('assignedToStaff', 'firstName lastName')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async findByOrderNumber(orderNumber: string): Promise<OrderDocument> {
        const order = await this.orderModel
            .findOne({ orderNumber })
            .populate('userId', 'firstName lastName email phone')
            .populate('assignedToStaff', 'firstName lastName')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, staffId: string): Promise<OrderDocument> {
        const orderDoc = await this.orderModel.findById(id);
        if (!orderDoc) {
            throw new NotFoundException('Order not found');
        }

        // Validate status transition
        this.validateStatusTransition(orderDoc.status, updateStatusDto.status);

        orderDoc.status = updateStatusDto.status;
        orderDoc.timeline.push({
            status: updateStatusDto.status,
            timestamp: new Date(),
            staffId: new Types.ObjectId(staffId),
            notes: updateStatusDto.notes
        });

        // Auto-calculate prep time when order is completed
        if (updateStatusDto.status === OrderStatus.COMPLETED && !orderDoc.actualPrepTime) {
            const createdAt = new Date(orderDoc.createdAt);
            const now = new Date();
            orderDoc.actualPrepTime = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60));
        }

        await orderDoc.save();
        return this.findById(id);
    }

    async assignStaff(id: string, assignStaffDto: AssignStaffDto): Promise<OrderDocument> {
        const orderDoc = await this.orderModel.findById(id);
        if (!orderDoc) {
            throw new NotFoundException('Order not found');
        }

        // Validate staff exists and has kitchen role
        const staff = await this.userModel.findById(assignStaffDto.staffId);
        if (!staff || staff.role !== UserRole.KITCHEN_STAFF) {
            throw new BadRequestException('Invalid staff member');
        }

        orderDoc.assignedToStaff = new Types.ObjectId(assignStaffDto.staffId);
        orderDoc.timeline.push({
            status: orderDoc.status,
            timestamp: new Date(),
            staffId: new Types.ObjectId(assignStaffDto.staffId),
            notes: `Assigned to ${staff.firstName} ${staff.lastName}`
        });

        await orderDoc.save();
        return this.findById(id);
    }

    async addRating(id: string, ratingDto: OrderRatingDto, userId: string): Promise<OrderDocument> {
        const orderDoc = await this.orderModel.findById(id);
        if (!orderDoc) {
            throw new NotFoundException('Order not found');
        }

        // Validate user owns this order
        if (orderDoc.userId.toString() !== userId) {
            throw new ForbiddenException('You can only rate your own orders');
        }

        // Validate order is completed
        if (orderDoc.status !== OrderStatus.COMPLETED) {
            throw new BadRequestException('You can only rate completed orders');
        }

        orderDoc.ratings = {
            ...ratingDto,
            ratedAt: new Date()
        };

        await orderDoc.save();
        return this.findById(id);
    }

    async update(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderDocument> {
        const orderDoc = await this.orderModel.findById(id);
        if (!orderDoc) {
            throw new NotFoundException('Order not found');
        }

        // Update allowed fields
        if (updateOrderDto.status !== undefined) {
            this.validateStatusTransition(orderDoc.status, updateOrderDto.status);
            orderDoc.status = updateOrderDto.status;
        }

        if (updateOrderDto.paymentStatus !== undefined) {
            orderDoc.paymentStatus = updateOrderDto.paymentStatus;
        }

        if (updateOrderDto.paymentIntentId !== undefined) {
            orderDoc.paymentIntentId = updateOrderDto.paymentIntentId;
        }

        if (updateOrderDto.specialInstructions !== undefined) {
            orderDoc.specialInstructions = updateOrderDto.specialInstructions;
        }

        if (updateOrderDto.scheduledFor !== undefined) {
            orderDoc.scheduledFor = new Date(updateOrderDto.scheduledFor);
        }

        if (updateOrderDto.assignedToStaff !== undefined) {
            orderDoc.assignedToStaff = new Types.ObjectId(updateOrderDto.assignedToStaff);
        }

        if (updateOrderDto.actualPrepTime !== undefined) {
            orderDoc.actualPrepTime = updateOrderDto.actualPrepTime;
        }

        if (updateOrderDto.tip !== undefined) {
            const tipDifference = updateOrderDto.tip - orderDoc.tip;
            orderDoc.tip = updateOrderDto.tip;
            orderDoc.total += tipDifference;
        }

        if (updateOrderDto.ratings !== undefined) {
            orderDoc.ratings = {
                ...updateOrderDto.ratings,
                ratedAt: new Date()
            };
        }

        // Add timeline entry if status changed
        if (updateOrderDto.status !== undefined || updateOrderDto.statusNotes) {
            orderDoc.timeline.push({
                status: orderDoc.status,
                timestamp: new Date(),
                notes: updateOrderDto.statusNotes
            });
        }

        await orderDoc.save();
        return this.findById(id);
    }

    async remove(id: string): Promise<void> {
        const orderDoc = await this.orderModel.findById(id);
        if (!orderDoc) {
            throw new NotFoundException('Order not found');
        }

        // Only allow deletion of pending orders
        if (orderDoc.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Only pending orders can be deleted');
        }

        await this.orderModel.findByIdAndDelete(id);
    }

    // Private helper methods
    private async validateAndCalculateOrder(createOrderDto: CreateOrderDto) {
        const items = [];
        let subtotal = 0;

        for (const itemDto of createOrderDto.items) {
            // Validate menu item exists and is available
            const menuItem = await this.menuItemModel.findById(itemDto.menuItemId);
            if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
                throw new BadRequestException(`Menu item ${itemDto.menuItemId} is not available`);
            }

            // Calculate item price with customizations
            let itemPrice = menuItem.basePrice;
            const selectedCustomizations = [];

            if (itemDto.customizations) {
                for (const customization of itemDto.customizations) {
                    const menuCustomization = menuItem.customizations.find(c => c.id === customization.customizationId);
                    if (!menuCustomization) {
                        throw new BadRequestException(`Invalid customization: ${customization.customizationId}`);
                    }

                    for (const option of customization.selectedOptions) {
                        const customizationOption = menuCustomization.options.find(o => o.id === option.optionId);
                        if (!customizationOption) {
                            throw new BadRequestException(`Invalid customization option: ${option.optionId}`);
                        }
                        itemPrice += customizationOption.priceModifier;
                    }

                    selectedCustomizations.push(customization);
                }
            }

            const itemSubtotal = itemPrice * itemDto.quantity;
            subtotal += itemSubtotal;

            items.push({
                menuItemId: new Types.ObjectId(itemDto.menuItemId),
                name: menuItem.name,
                price: itemPrice,
                quantity: itemDto.quantity,
                customizations: selectedCustomizations,
                specialInstructions: itemDto.specialInstructions,
                subtotal: itemSubtotal
            });
        }

        // Calculate pricing
        const tax = subtotal * 0.08; // 8% tax rate
        const deliveryFee = createOrderDto.orderType === 'delivery' ? 3.99 : 0;
        const discount = 0; // TODO: Implement discount logic
        const tip = createOrderDto.tip || 0;
        const total = subtotal + tax + deliveryFee + tip - discount;

        return {
            items,
            pricing: {
                subtotal,
                tax: Number(tax.toFixed(2)),
                deliveryFee,
                discount,
                total: Number(total.toFixed(2))
            }
        };
    }

    private calculateEstimatedPrepTime(items: any[], orderType: string): number {
        // Base preparation time based on number of items
        let prepTime = Math.max(10, items.length * 5);

        // Add complexity based on customizations
        for (const item of items) {
            if (item.customizations && item.customizations.length > 0) {
                prepTime += item.customizations.length * 2;
            }
        }

        // Adjust for order type
        if (orderType === 'delivery') {
            prepTime += 20; // Additional time for delivery preparation
        } else if (orderType === 'dine-in') {
            prepTime += 5; // Slight additional time for plating
        }

        return Math.min(prepTime, 60); // Cap at 60 minutes
    }

    private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
        const validTransitions = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
            [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
            [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.OUT_FOR_DELIVERY],
            [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.COMPLETED],
            [OrderStatus.COMPLETED]: [],
            [OrderStatus.CANCELLED]: []
        };

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
    }

    private async updateMenuItemSoldCounts(items: any[]): Promise<void> {
        const updatePromises = items.map(item =>
            this.menuItemModel.findByIdAndUpdate(
                item.menuItemId,
                { $inc: { soldCount: item.quantity } }
            )
        );

        await Promise.all(updatePromises);
    }
}