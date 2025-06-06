// apps/api/src/orders/order.controller.ts
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
    Request,
    HttpStatus,
    HttpCode,
    BadRequestException
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole, OrderStatus } from '@restaurant-pos/shared-types';
import { CreateOrderDto } from './dto/create-order.dto';
import { KitchenOrderResponseDto, OrderResponseDto, OrderSummaryResponseDto } from './dto/order-response.dto';
import { CustomerOrderQueryDto, KitchenOrderQueryDto, OrderQueryDto } from './dto/order-query.dto';
import { AssignStaffDto, OrderRatingDto, UpdateOrderDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderDocument } from './schemas/order.schema';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    // Customer endpoints
    @Post()
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
        const order = await this.orderService.create(createOrderDto, req.user.id);
        return {
            success: true,
            message: 'Order created successfully',
            data: order
        };
    }

    @Get('my-orders')
    @Roles(UserRole.CUSTOMER)
    async getMyOrders(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: OrderStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',

    ) {
        const result = await this.orderService.findAll({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            startDate,
            endDate,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc',
            userId: req.user.id
        }, UserRole.CUSTOMER, req.user.id);

        return {
            success: true,
            data: {
                orders: result.orders,
                pagination: {
                    page: parseInt(page) || 1,
                    limit: parseInt(limit) || 10,
                    total: result.total,
                    pages: result.pages
                }
            }
        };
    }

    @Get('my-orders/:id')
    @Roles(UserRole.CUSTOMER)
    async getMyOrder(@Param('id') id: string, @Request() req) {
        const order = await this.orderService.findById(id);

        // Ensure customer can only see their own orders
        if (order.userId.toString() !== req.user.id) {
            throw new BadRequestException('Order not found');
        }

        return {
            success: true,
            data: order
        };
    }

    @Post(':id/rating')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async addRating(
        @Param('id') id: string,
        @Body() ratingDto: OrderRatingDto,
        @Request() req
    ) {
        const order = await this.orderService.addRating(id, ratingDto, req.user.id);
        return {
            success: true,
            message: 'Rating added successfully',
            data: order
        };
    }

    // Kitchen staff endpoints
    @Get('kitchen')
    @Roles(UserRole.KITCHEN_STAFF, UserRole.ADMIN)
    async getKitchenOrders(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: OrderStatus.PENDING | OrderStatus.CONFIRMED | OrderStatus.PREPARING | OrderStatus.READY,
        @Query('orderType') orderType?: 'pickup' | 'delivery' | 'dine-in',
        @Query('assignedToStaff') assignedToStaff?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc'
    ) {
        const result = await this.orderService.findKitchenOrders({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            status,
            orderType,
            assignedToStaff,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'asc'
        });

        return {
            success: true,
            data: {
                orders: result.orders,
                pagination: {
                    page: parseInt(page) || 1,
                    limit: parseInt(limit) || 20,
                    total: result.total,
                    pages: Math.ceil(result.total / (parseInt(limit) || 20))
                }
            }
        };
    }

    @Get('kitchen/:id')
    @Roles(UserRole.KITCHEN_STAFF, UserRole.ADMIN)
    async getKitchenOrder(@Param('id') id: string) {
        const order = await this.orderService.findById(id);
        return {
            success: true,
            data: order
        };
    }

    @Patch(':id/status')
    @Roles(UserRole.KITCHEN_STAFF, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async updateOrderStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateOrderStatusDto,
        @Request() req
    ) {
        const order = await this.orderService.updateStatus(id, updateStatusDto, req.user.id);
        return {
            success: true,
            message: 'Order status updated successfully',
            data: order
        };
    }

    @Patch(':id/assign')
    @Roles(UserRole.KITCHEN_STAFF, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async assignStaff(
        @Param('id') id: string,
        @Body() assignStaffDto: AssignStaffDto
    ) {
        const order = await this.orderService.assignStaff(id, assignStaffDto);
        return {
            success: true,
            message: 'Staff assigned successfully',
            data: order
        };
    }

    // Admin endpoints
    @Get()
    @Roles(UserRole.ADMIN)
    async findAll(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: OrderStatus,
        @Query('paymentStatus') paymentStatus?: string,
        @Query('orderType') orderType?: 'pickup' | 'delivery' | 'dine-in',
        @Query('userId') userId?: string,
        @Query('assignedToStaff') assignedToStaff?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('orderNumber') orderNumber?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('search') search?: string,
    ) {
        const result = await this.orderService.findAll({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            paymentStatus: paymentStatus as any,
            orderType,
            userId,
            assignedToStaff,
            startDate,
            endDate,
            orderNumber,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc',
            search
        }, req.user.role);

        return {
            success: true,
            data: {
                orders: result.orders,
                pagination: {
                    page: parseInt(page) || 1,
                    limit: parseInt(limit) || 10,
                    total: result.total,
                    pages: result.pages
                }
            }
        };
    }

    @Get('summary')
    @Roles(UserRole.ADMIN)
    async getOrdersSummary(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: OrderStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc'
    ) {
        const result = await this.orderService.findAll({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 10,
            status,
            startDate,
            endDate,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc'
        }, UserRole.ADMIN);

        return {
            success: true,
            data: {
                orders: result.orders.map(order => ({
                    _id: order._id.toString(),
                    orderNumber: order.orderNumber,
                    status: order.status,
                    orderType: order.orderType,
                    total: order.total,
                    itemCount: order.items.length,
                    createdAt: order.createdAt,
                    estimatedPrepTime: order.estimatedPrepTime
                })),
                pagination: {
                    page: parseInt(page) || 1,
                    limit: parseInt(limit) || 10,
                    total: result.total,
                    pages: result.pages
                }
            }
        };
    }

    @Get('by-number/:orderNumber')
    @Roles(UserRole.ADMIN, UserRole.KITCHEN_STAFF)
    async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
        const order = await this.orderService.findByOrderNumber(orderNumber);
        return {
            success: true,
            data: order
        };
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    async findOne(@Param('id') id: string) {
        const order = await this.orderService.findById(id);
        return {
            success: true,
            data: order
        };
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
        const order = await this.orderService.update(id, updateOrderDto);
        return {
            success: true,
            message: 'Order updated successfully',
            data: order
        };
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.orderService.remove(id);
        return {
            success: true,
            message: 'Order deleted successfully'
        };
    }

    // Analytics endpoints
    @Get('analytics/stats')
    @Roles(UserRole.ADMIN)
    async getOrderStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: OrderStatus
    ) {
        const result = await this.orderService.findAll({
            startDate,
            endDate,
            status,
            limit: 1000 // Get more data for analytics
        }, UserRole.ADMIN);

        const stats = {
            total: result.total,
            statusBreakdown: this.calculateStatusBreakdown(result.orders),
            orderTypeBreakdown: this.calculateOrderTypeBreakdown(result.orders),
            totalRevenue: this.calculateTotalRevenue(result.orders),
            averageOrderValue: this.calculateAverageOrderValue(result.orders),
            topItems: this.calculateTopItems(result.orders)
        };

        return {
            success: true,
            data: stats
        };
    }

    // Public endpoints (for order tracking)
    @Get('track/:orderNumber')
    @Public()
    async trackOrder(@Param('orderNumber') orderNumber: string) {
        const order = await this.orderService.findByOrderNumber(orderNumber);

        // Return minimal tracking info for public access
        return {
            success: true,
            data: {
                orderNumber: order.orderNumber,
                status: order.status,
                estimatedPrepTime: order.estimatedPrepTime,
                actualPrepTime: order.actualPrepTime,
                orderType: order.orderType,
                timeline: order.timeline.map(t => ({
                    status: t.status,
                    timestamp: t.timestamp
                })),
                createdAt: order.createdAt
            }
        };
    }

    // Helper methods for analytics
    private calculateStatusBreakdown(orders: OrderDocument[]): Record<string, number> {
        return orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
    }

    private calculateOrderTypeBreakdown(orders: OrderDocument[]): Record<string, number> {
        return orders.reduce((acc, order) => {
            acc[order.orderType] = (acc[order.orderType] || 0) + 1;
            return acc;
        }, {});
    }

    private calculateTotalRevenue(orders: OrderDocument[]): number {
        return orders
            .filter(order => order.status === OrderStatus.COMPLETED)
            .reduce((total, order) => total + order.total, 0);
    }

    private calculateAverageOrderValue(orders: OrderDocument[]): number {
        const completedOrders = orders.filter(order => order.status === OrderStatus.COMPLETED);
        if (completedOrders.length === 0) return 0;

        const totalRevenue = this.calculateTotalRevenue(orders);
        return Number((totalRevenue / completedOrders.length).toFixed(2));
    }

    private calculateTopItems(orders: OrderDocument[]): Array<{ name: string; quantity: number }> {
        const itemCounts = {};

        orders
            .filter(order => order.status === OrderStatus.COMPLETED)
            .forEach(order => {
                order.items.forEach(item => {
                    itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
                });
            });

        return Object.entries(itemCounts)
            .map(([name, quantity]) => ({ name, quantity: quantity as number }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    }
}