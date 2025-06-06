// apps/api/src/cart/cart.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart, CartSchema } from './schemas/cart.schema';
import { MenuItem, MenuItemSchema } from '../menu-items/schemas/menu-item.schema';
import { OrderModule } from '../orders/order.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Cart.name, schema: CartSchema },
            { name: MenuItem.name, schema: MenuItemSchema }
        ]),
        OrderModule // Import OrderModule to use OrderService
    ],
    controllers: [CartController],
    providers: [CartService],
    exports: [CartService]
})
export class CartModule { }