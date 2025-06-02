// apps/api/src/menu-items/menu-items.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuItemsService } from './menu-items.service';
import { MenuItemsController } from './menu-items.controller';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { CategoriesModule } from '../categories/categories.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: MenuItem.name, schema: MenuItemSchema }]),
        CategoriesModule // Import to use CategoriesService
    ],
    controllers: [MenuItemsController],
    providers: [MenuItemsService],
    exports: [MenuItemsService], // Export for use in other modules (like orders)
})
export class MenuItemsModule { }