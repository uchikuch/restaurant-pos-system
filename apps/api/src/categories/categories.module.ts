// apps/api/src/categories/categories.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './schemas/category.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])
    ],
    controllers: [CategoriesController],
    providers: [CategoriesService],
    exports: [CategoriesService], // Export for use in other modules
})
export class CategoriesModule { }