// apps/api/src/cart/cart.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
    BadRequestException,
    Headers
} from '@nestjs/common';
import { CartService } from './cart.service';
import { OrderService } from '../orders/order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@restaurant-pos/shared-types';
import { AddToCartDto, UpdateCartItemDto, UpdateCartDto } from './dto';
import { randomUUID } from 'crypto';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CartController {
    constructor(
        private readonly cartService: CartService,
        private readonly orderService: OrderService
    ) { }

    // Get current cart (authenticated users)
    @Get()
    @Roles(UserRole.CUSTOMER)
    async getCart(@Request() req) {
        const cart = await this.cartService.getCart(req.user.id);
        return {
            success: true,
            data: cart
        };
    }

    // Get current cart (guest users)
    @Get('guest/:sessionId')
    @Public()
    async getGuestCart(@Param('sessionId') sessionId: string) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }

        const cart = await this.cartService.getCart(undefined, sessionId);
        return {
            success: true,
            data: cart
        };
    }

    // Add item to cart (authenticated users)
    @Post('items')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
        const cart = await this.cartService.addToCart(addToCartDto, req.user.id);
        return {
            success: true,
            message: 'Item added to cart successfully',
            data: cart
        };
    }

    // Add item to cart (guest users)
    @Post('guest/:sessionId/items')
    @Public()
    @HttpCode(HttpStatus.OK)
    async addToGuestCart(
        @Param('sessionId') sessionId: string,
        @Body() addToCartDto: AddToCartDto
    ) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }

        const cart = await this.cartService.addToCart(addToCartDto, undefined, sessionId);
        return {
            success: true,
            message: 'Item added to cart successfully',
            data: cart
        };
    }

    // Update cart item (authenticated users)
    @Patch('items/:itemId')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async updateCartItem(
        @Param('itemId') itemId: string,
        @Body() updateDto: UpdateCartItemDto,
        @Request() req
    ) {
        // Get user's cart first
        const userCart = await this.cartService.getCart(req.user.id);

        const cart = await this.cartService.updateCartItem(
            userCart._id.toString(),
            itemId,
            updateDto,
            req.user.id
        );

        return {
            success: true,
            message: 'Cart item updated successfully',
            data: cart
        };
    }

    // Update cart item (guest users)
    @Patch('guest/:sessionId/items/:itemId')
    @Public()
    @HttpCode(HttpStatus.OK)
    async updateGuestCartItem(
        @Param('sessionId') sessionId: string,
        @Param('itemId') itemId: string,
        @Body() updateDto: UpdateCartItemDto
    ) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }

        // ✅ Find existing cart, don't create new one
        const existingCart = await this.cartService.findGuestCart(sessionId);

        if (!existingCart) {
            throw new BadRequestException('Cart not found for this session');
        }

        const cart = await this.cartService.updateCartItem(
            existingCart._id.toString(),
            itemId,
            updateDto,
            undefined,
            sessionId
        );

        return {
            success: true,
            message: 'Cart item updated successfully',
            data: cart
        };
    }


    // Remove item from cart (authenticated users)
    @Delete('items/:itemId')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async removeCartItem(@Param('itemId') itemId: string, @Request() req) {
        // Get user's cart first
        const userCart = await this.cartService.getCart(req.user.id);

        const cart = await this.cartService.removeCartItem(
            userCart._id.toString(),
            itemId,
            req.user.id
        );

        return {
            success: true,
            message: 'Item removed from cart successfully',
            data: cart
        };
    }

    // Remove item from cart (guest users)
    @Delete('guest/:sessionId/items/:itemId')
    @Public()
    @HttpCode(HttpStatus.OK)
    async removeGuestCartItem(
        @Param('sessionId') sessionId: string,
        @Param('itemId') itemId: string
    ) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }

        // ✅ Find existing cart, don't create new one
        const existingCart = await this.cartService.findGuestCart(sessionId);

        if (!existingCart) {
            throw new BadRequestException('Cart not found for this session');
        }

        const cart = await this.cartService.removeCartItem(
            existingCart._id.toString(),
            itemId,
            undefined,
            sessionId
        );

        return {
            success: true,
            message: 'Item removed from cart successfully',
            data: cart
        };
    }

    // Update cart settings (authenticated users)
    @Patch('settings')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async updateCart(@Body() updateDto: UpdateCartDto, @Request() req) {
        // Get user's cart first
        const userCart = await this.cartService.getCart(req.user.id);

        const cart = await this.cartService.updateCart(
            userCart._id.toString(),
            updateDto,
            req.user.id
        );

        return {
            success: true,
            message: 'Cart updated successfully',
            data: cart
        };
    }

    // Update cart settings (guest users)
    @Patch('guest/:sessionId/settings')
    @Public()
    @HttpCode(HttpStatus.OK)
    async updateGuestCart(
        @Param('sessionId') sessionId: string,
        @Body() updateDto: UpdateCartDto
    ) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }

        console.log(`🔄 Updating guest cart settings for session: ${sessionId}`);

        // ❌ PROBLEM: This line creates a NEW cart if none exists
        // const guestCart = await this.cartService.getCart(undefined, sessionId);

        // ✅ SOLUTION: Find existing cart ONLY, don't create new one
        const existingCart = await this.cartService.findGuestCart(sessionId);

        if (!existingCart) {
            throw new BadRequestException('Cart not found for this session. Please add items first.');
        }

        console.log(`📦 Found existing cart: ${existingCart._id} with ${existingCart.items.length} items`);

        const cart = await this.cartService.updateCart(
            existingCart._id.toString(),
            updateDto,
            undefined,
            sessionId
        );

        return {
            success: true,
            message: 'Cart updated successfully',
            data: cart
        };
    }

    // Clear cart (authenticated users)
    @Delete('clear')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async clearCart(@Request() req) {
        // Get user's cart first
        const userCart = await this.cartService.getCart(req.user.id);

        const cart = await this.cartService.clearCart(
            userCart._id.toString(),
            req.user.id
        );

        return {
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        };
    }

    // Clear cart (guest users)
    @Delete('guest/:sessionId/clear')
    @Public()
    @HttpCode(HttpStatus.OK)
    async clearGuestCart(@Param('sessionId') sessionId: string) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }

        // ✅ Find existing cart, don't create new one
        const existingCart = await this.cartService.findGuestCart(sessionId);

        if (!existingCart) {
            throw new BadRequestException('Cart not found for this session');
        }

        const cart = await this.cartService.clearCart(
            existingCart._id.toString(),
            undefined,
            sessionId
        );

        return {
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        };
    }

    @Get('debug/session/:sessionId')
    @Public()
    async debugSession(@Param('sessionId') sessionId: string) {
        const carts = await this.cartService.debugGetAllCartsForSession(sessionId);
        return {
            success: true,
            data: {
                sessionId,
                totalCarts: carts.length,
                carts
            }
        };
    }

    // Convert cart to order and checkout (authenticated users only)
    @Post('checkout')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.CREATED)
    async checkout(@Request() req) {
        try {
            // Get user's cart
            const userCart = await this.cartService.getCart(req.user.id);

            if (userCart.items.length === 0) {
                throw new BadRequestException('Cart is empty');
            }

            // Convert cart to order format
            const createOrderDto = await this.cartService.convertCartToOrder(
                userCart._id.toString(),
                req.user.id
            );

            // Create the order
            const order = await this.orderService.create(createOrderDto, req.user.id);

            // Clear the cart after successful order creation
            await this.cartService.clearCart(
                userCart._id.toString(),
                req.user.id
            );

            return {
                success: true,
                message: 'Order created successfully from cart',
                data: {
                    order,
                    orderNumber: order.orderNumber
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Get cart summary (authenticated users)
    @Get('summary')
    @Roles(UserRole.CUSTOMER)
    async getCartSummary(@Request() req) {
        const cart = await this.cartService.getCart(req.user.id);

        const summary = {
            itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
            subtotal: cart.subtotal,
            tax: cart.tax,
            deliveryFee: cart.deliveryFee,
            discount: cart.discount,
            total: cart.total,
            estimatedPrepTime: cart.estimatedPrepTime,
            isEmpty: cart.items.length === 0
        };

        return {
            success: true,
            data: summary
        };
    }

    // Get cart summary (guest users)
    @Get('guest/:sessionId/summary')
    @Public()
    async getGuestCartSummary(@Param('sessionId') sessionId: string) {
        if (!sessionId) {
            throw new BadRequestException('Session ID is required');
        }

        const cart = await this.cartService.getCart(undefined, sessionId);

        const summary = {
            itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
            subtotal: cart.subtotal,
            tax: cart.tax,
            deliveryFee: cart.deliveryFee,
            discount: cart.discount,
            total: cart.total,
            estimatedPrepTime: cart.estimatedPrepTime,
            isEmpty: cart.items.length === 0
        };

        return {
            success: true,
            data: summary
        };
    }

    // Generate session ID for guest users
    @Post('guest/session')
    @Public()
    @HttpCode(HttpStatus.OK)
    async generateGuestSession() {
        const sessionId = randomUUID();
        return {
            success: true,
            data: {
                sessionId,
                message: 'Guest session created successfully'
            }
        };
    }

    // Merge guest cart with user cart (when user logs in)
    @Post('merge/:sessionId')
    @Roles(UserRole.CUSTOMER)
    @HttpCode(HttpStatus.OK)
    async mergeGuestCart(@Param('sessionId') sessionId: string, @Request() req) {
        try {
            if (!sessionId) {
                throw new BadRequestException('Session ID is required');
            }

            // Get both carts
            const guestCart = await this.cartService.getCart(undefined, sessionId);
            const userCart = await this.cartService.getCart(req.user.id);

            // If guest cart is empty, return user cart
            if (guestCart.items.length === 0) {
                return {
                    success: true,
                    message: 'No items to merge',
                    data: userCart
                };
            }

            // Add each guest cart item to user cart
            for (const guestItem of guestCart.items) {
                const addToCartDto: AddToCartDto = {
                    menuItemId: guestItem.menuItemId.toString(),
                    quantity: guestItem.quantity,
                    customizations: guestItem.customizations.map(c => ({
                        customizationId: c.customizationId,
                        customizationName: c.customizationName,
                        selectedOptions: c.selectedOptions
                    })),
                    specialInstructions: guestItem.specialInstructions
                };

                await this.cartService.addToCart(addToCartDto, req.user.id);
            }

            // Delete guest cart
            await this.cartService.deleteCart(guestCart._id.toString(), undefined, sessionId);

            // Return updated user cart
            const updatedUserCart = await this.cartService.getCart(req.user.id);

            return {
                success: true,
                message: 'Guest cart merged successfully',
                data: updatedUserCart
            };
        } catch (error) {
            throw error;
        }
    }
}