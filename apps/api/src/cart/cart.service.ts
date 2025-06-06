// apps/api/src/cart/cart.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { MenuItem, MenuItemDocument } from '../menu-items/schemas/menu-item.schema';
import { AddToCartDto, UpdateCartItemDto, UpdateCartDto } from './dto';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
        @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    ) { }

    async findOrCreateCart(userId?: string, sessionId?: string): Promise<CartDocument> {
        try {
            let cart: CartDocument;

            if (userId) {
                // Find existing cart for logged-in user
                cart = await this.cartModel
                    .findOne({ userId: new Types.ObjectId(userId) })
                    .populate('items.menuItemId', 'name basePrice isActive isAvailable')
                    .exec();

                console.log(`🔍 Looking for user cart: ${userId}`, cart ? `Found: ${cart._id}` : 'Not found');
            } else if (sessionId) {
                // Find existing cart for guest user
                cart = await this.cartModel
                    .findOne({ sessionId: sessionId }) // Remove any extra conditions
                    .populate('items.menuItemId', 'name basePrice isActive isAvailable')
                    .exec();

                console.log(`🔍 Looking for guest cart: ${sessionId}`, cart ? `Found: ${cart._id}` : 'Not found');
            }

            if (!cart) {
                console.log('📦 Creating new cart...');
                // Create new cart
                const cartData: any = {
                    items: [],
                    orderType: 'pickup',
                    subtotal: 0,
                    tax: 0,
                    deliveryFee: 0,
                    discount: 0,
                    total: 0,
                    estimatedPrepTime: 0
                };

                if (userId) {
                    cartData.userId = new Types.ObjectId(userId);
                    console.log(`👤 Creating user cart for: ${userId}`);
                } else if (sessionId) {
                    cartData.sessionId = sessionId;
                    console.log(`👥 Creating guest cart for session: ${sessionId}`);
                } else {
                    throw new BadRequestException('Either userId or sessionId must be provided');
                }

                cart = new this.cartModel(cartData);
                await cart.save();
                console.log(`✅ New cart created: ${cart._id}`);
            } else {
                console.log(`♻️  Using existing cart: ${cart._id}`);
            }

            return cart;
        } catch (error) {
            console.error('❌ findOrCreateCart error:', error);
            throw error;
        }
    }

    // Debug method to list all carts for a session
    async debugGetAllCartsForSession(sessionId: string): Promise<any[]> {
        try {
            const carts = await this.cartModel
                .find({ sessionId: sessionId })
                .select('_id sessionId items.length subtotal total orderType createdAt')
                .exec();

            console.log(`🔍 All carts for session ${sessionId}:`, carts);
            return carts;
        } catch (error) {
            console.error('❌ debugGetAllCartsForSession error:', error);
            return [];
        }
    }

    async findGuestCart(sessionId: string): Promise<CartDocument | null> {
        try {
            const cart = await this.cartModel
                .findOne({
                    sessionId: sessionId,
                    userId: { $exists: false } // Ensure it's a guest cart
                })
                .populate('items.menuItemId', 'name basePrice isActive isAvailable')
                .exec();

            console.log(`🔍 Guest cart lookup for ${sessionId}:`, cart ? `Found ${cart._id}` : 'Not found');
            return cart;
        } catch (error) {
            console.error('❌ findGuestCart error:', error);
            return null;
        }
    }


    async addToCart(addToCartDto: AddToCartDto, userId?: string, sessionId?: string): Promise<CartDocument> {
        try {
            // Validate menu item exists and is available
            const menuItem = await this.menuItemModel.findById(addToCartDto.menuItemId).exec();
            if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
                throw new BadRequestException(`Menu item is not available`);
            }

            // Get or create cart
            const cart = await this.findOrCreateCart(userId, sessionId);

            // Calculate item price with customizations
            const { itemPrice, processedCustomizations } = await this.calculateItemPrice(
                menuItem,
                addToCartDto.customizations || []
            );

            // Check if identical item already exists in cart
            const existingItemIndex = this.findIdenticalCartItem(cart.items, addToCartDto, processedCustomizations);

            if (existingItemIndex !== -1) {
                // Update quantity of existing item
                cart.items[existingItemIndex].quantity += addToCartDto.quantity;
                cart.items[existingItemIndex].subtotal = Number(
                    (cart.items[existingItemIndex].itemPrice * cart.items[existingItemIndex].quantity).toFixed(2)
                );
            } else {
                // Add new item to cart
                const cartItem = {
                    menuItemId: new Types.ObjectId(addToCartDto.menuItemId),
                    name: menuItem.name,
                    basePrice: menuItem.basePrice,
                    quantity: addToCartDto.quantity,
                    customizations: processedCustomizations,
                    specialInstructions: addToCartDto.specialInstructions,
                    itemPrice: Number(itemPrice.toFixed(2)),
                    subtotal: Number((itemPrice * addToCartDto.quantity).toFixed(2))
                };

                cart.items.push(cartItem);
            }

            // Save cart (triggers auto-calculation)
            await cart.save();

            return await this.findCartById(cart._id.toString());
        } catch (error) {
            throw error;
        }
    }

    async updateCartItem(cartId: string, itemId: string, updateDto: UpdateCartItemDto, userId?: string, sessionId?: string): Promise<CartDocument> {
        try {
            const cart = await this.findCartById(cartId);
            this.validateCartOwnership(cart, userId, sessionId);

            const itemIndex = cart.items.findIndex(item =>
                item._id && item._id.toString() === itemId
            );
            if (itemIndex === -1) {
                throw new NotFoundException('Cart item not found');
            }

            const cartItem = cart.items[itemIndex];
            const menuItem = await this.menuItemModel.findById(cartItem.menuItemId).exec();
            if (!menuItem) {
                throw new NotFoundException('Menu item not found');
            }

            // Update quantity if provided
            if (updateDto.quantity !== undefined) {
                cartItem.quantity = updateDto.quantity;
            }

            // Update customizations if provided
            if (updateDto.customizations !== undefined) {
                const { itemPrice, processedCustomizations } = await this.calculateItemPrice(
                    menuItem,
                    updateDto.customizations
                );
                cartItem.customizations = processedCustomizations;
                cartItem.itemPrice = Number(itemPrice.toFixed(2));
            }

            // Update special instructions if provided
            if (updateDto.specialInstructions !== undefined) {
                cartItem.specialInstructions = updateDto.specialInstructions;
            }

            // Recalculate subtotal
            cartItem.subtotal = Number((cartItem.itemPrice * cartItem.quantity).toFixed(2));

            await cart.save();
            return await this.findCartById(cartId);
        } catch (error) {
            throw error;
        }
    }

    async removeCartItem(cartId: string, itemId: string, userId?: string, sessionId?: string): Promise<CartDocument> {
        try {
            const cart = await this.findCartById(cartId);
            this.validateCartOwnership(cart, userId, sessionId);

            const itemIndex = cart.items.findIndex(item =>
                item._id && item._id.toString() === itemId
            );
            if (itemIndex === -1) {
                throw new NotFoundException('Cart item not found');
            }

            cart.items.splice(itemIndex, 1);
            await cart.save();

            return await this.findCartById(cartId);
        } catch (error) {
            throw error;
        }
    }

    async updateCart(cartId: string, updateDto: UpdateCartDto, userId?: string, sessionId?: string): Promise<CartDocument> {
        try {
            const cart = await this.findCartById(cartId);
            this.validateCartOwnership(cart, userId, sessionId);

            // Validate delivery address for delivery orders
            if (updateDto.orderType === 'delivery' && !updateDto.deliveryAddress) {
                throw new BadRequestException('Delivery address is required for delivery orders');
            }

            // Update cart properties
            if (updateDto.orderType !== undefined) {
                cart.orderType = updateDto.orderType;
            }

            if (updateDto.deliveryAddress !== undefined) {
                cart.deliveryAddress = updateDto.deliveryAddress;
            }

            if (updateDto.specialInstructions !== undefined) {
                cart.specialInstructions = updateDto.specialInstructions;
            }

            await cart.save();
            return await this.findCartById(cartId);
        } catch (error) {
            throw error;
        }
    }

    async clearCart(cartId: string, userId?: string, sessionId?: string): Promise<CartDocument> {
        try {
            const cart = await this.findCartById(cartId);
            this.validateCartOwnership(cart, userId, sessionId);

            cart.items = [];
            await cart.save();

            return await this.findCartById(cartId);
        } catch (error) {
            throw error;
        }
    }

    async getCart(userId?: string, sessionId?: string): Promise<CartDocument> {
        return await this.findOrCreateCart(userId, sessionId);
    }

    async convertCartToOrder(cartId: string, userId: string): Promise<CreateOrderDto> {
        try {
            const cart = await this.findCartById(cartId);

            if (!cart.userId || cart.userId.toString() !== userId) {
                throw new BadRequestException('Cart does not belong to this user');
            }

            if (cart.items.length === 0) {
                throw new BadRequestException('Cart is empty');
            }

            // Validate all items are still available
            for (const cartItem of cart.items) {
                // Fix: Extract the actual ObjectId from populated or non-populated field
                const menuItemId = cartItem.menuItemId._id || cartItem.menuItemId;
                const menuItem = await this.menuItemModel.findById(menuItemId).exec();
                if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
                    throw new BadRequestException(`Menu item "${cartItem.name}" is no longer available`);
                }
            }

            // Convert cart items to order format
            const orderItems = cart.items.map(cartItem => {
                // Fix: Properly extract the ObjectId whether populated or not
                const menuItemId = cartItem.menuItemId._id
                    ? cartItem.menuItemId._id.toString()
                    : cartItem.menuItemId.toString();

                return {
                    menuItemId: menuItemId,
                    quantity: cartItem.quantity,
                    customizations: cartItem.customizations.map(customization => ({
                        customizationId: customization.customizationId,
                        customizationName: customization.customizationName,
                        selectedOptions: customization.selectedOptions
                    })),
                    specialInstructions: cartItem.specialInstructions
                };
            });

            const createOrderDto: CreateOrderDto = {
                items: orderItems,
                orderType: cart.orderType as 'pickup' | 'delivery' | 'dine-in',
                deliveryAddress: cart.deliveryAddress ? {
                    street: cart.deliveryAddress.street,
                    city: cart.deliveryAddress.city,
                    state: cart.deliveryAddress.state,
                    zipCode: cart.deliveryAddress.zipCode,
                    instructions: cart.deliveryAddress.instructions
                } : undefined,
                specialInstructions: cart.specialInstructions
            };

            return createOrderDto;
        } catch (error) {
            console.error('❌ convertCartToOrder error:', error);
            throw error;
        }
    }

    // Alternative approach: Get cart without population for conversion
    // Add this method to CartService

    async

    async deleteCart(cartId: string, userId?: string, sessionId?: string): Promise<void> {
        try {
            const cart = await this.findCartById(cartId);
            this.validateCartOwnership(cart, userId, sessionId);

            await this.cartModel.findByIdAndDelete(cartId).exec();
        } catch (error) {
            throw error;
        }
    }

    // Private helper methods
    private async findCartById(cartId: string): Promise<CartDocument> {
        if (!Types.ObjectId.isValid(cartId)) {
            throw new BadRequestException('Invalid cart ID format');
        }

        const cart = await this.cartModel
            .findById(cartId)
            .populate('items.menuItemId', 'name basePrice isActive isAvailable')
            .exec();

        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        return cart;
    }

    private validateCartOwnership(cart: CartDocument, userId?: string, sessionId?: string): void {
        const userMatches = userId && cart.userId && cart.userId.toString() === userId;
        const sessionMatches = sessionId && cart.sessionId === sessionId;

        if (!userMatches && !sessionMatches) {
            throw new BadRequestException('Cart does not belong to this user or session');
        }
    }

    private async calculateItemPrice(menuItem: MenuItemDocument, customizations: any[]): Promise<{
        itemPrice: number;
        processedCustomizations: any[];
    }> {
        let itemPrice = menuItem.basePrice;
        const processedCustomizations = [];

        for (const customization of customizations) {
            const menuCustomization = menuItem.customizations.find(c => c.id === customization.customizationId);
            if (!menuCustomization) {
                throw new BadRequestException(`Invalid customization: ${customization.customizationId}`);
            }

            // Validate required customizations
            if (menuCustomization.required && (!customization.selectedOptions || customization.selectedOptions.length === 0)) {
                throw new BadRequestException(`Customization '${menuCustomization.name}' is required`);
            }

            const processedOptions = [];
            for (const option of customization.selectedOptions) {
                const customizationOption = menuCustomization.options.find(o => o.id === option.optionId);
                if (!customizationOption) {
                    throw new BadRequestException(`Invalid customization option: ${option.optionId}`);
                }
                itemPrice += customizationOption.priceModifier;
                processedOptions.push({
                    optionId: option.optionId,
                    optionName: customizationOption.name,
                    priceModifier: customizationOption.priceModifier
                });
            }

            processedCustomizations.push({
                customizationId: customization.customizationId,
                customizationName: menuCustomization.name,
                selectedOptions: processedOptions
            });
        }

        return { itemPrice, processedCustomizations };
    }

    private findIdenticalCartItem(cartItems: any[], newItem: AddToCartDto, processedCustomizations: any[]): number {
        return cartItems.findIndex(cartItem => {
            // Check if menu item ID matches
            if (cartItem.menuItemId.toString() !== newItem.menuItemId) {
                return false;
            }

            // Check if customizations match
            if (cartItem.customizations.length !== processedCustomizations.length) {
                return false;
            }

            // Deep compare customizations
            const customizationsMatch = cartItem.customizations.every(cartCustomization => {
                const matchingCustomization = processedCustomizations.find(
                    pc => pc.customizationId === cartCustomization.customizationId
                );

                if (!matchingCustomization) return false;

                // Compare selected options
                if (cartCustomization.selectedOptions.length !== matchingCustomization.selectedOptions.length) {
                    return false;
                }

                return cartCustomization.selectedOptions.every(cartOption => {
                    return matchingCustomization.selectedOptions.some(
                        pcOption => pcOption.optionId === cartOption.optionId
                    );
                });
            });

            // Check if special instructions match
            const instructionsMatch = cartItem.specialInstructions === newItem.specialInstructions;

            return customizationsMatch && instructionsMatch;
        });
    }
}