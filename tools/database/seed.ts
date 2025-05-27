// tools/database/seed.ts
import { NestFactory } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { UserRole } from '@restaurant-pos/shared-types';

// Import schemas
import { User, UserSchema } from '../../apps/api/src/users/schemas/user.schema';
import { Category, CategorySchema } from '../../apps/api/src/menu/schemas/category.schema';
import { MenuItem, MenuItemSchema } from '../../apps/api/src/menu/schemas/menu-item.schema';

class DatabaseSeeder {
    private userModel: Model<User>;
    private categoryModel: Model<Category>;
    private menuItemModel: Model<MenuItem>;

    async seed() {
        console.log('🌱 Starting database seeding...');

        // Connect to MongoDB
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/restaurant-pos');

        // Create models
        this.userModel = mongoose.model('User', UserSchema);
        this.categoryModel = mongoose.model('Category', CategorySchema);
        this.menuItemModel = mongoose.model('MenuItem', MenuItemSchema);

        // Clear existing data (in development only)
        if (process.env.NODE_ENV !== 'production') {
            console.log('🧹 Clearing existing data...');
            await this.userModel.deleteMany({});
            await this.categoryModel.deleteMany({});
            await this.menuItemModel.deleteMany({});
        }

        // Seed data
        await this.seedUsers();
        await this.seedCategories();
        await this.seedMenuItems();

        console.log('✅ Database seeding completed!');
        process.exit(0);
    }

    private async seedUsers() {
        console.log('👥 Seeding users...');

        const users = [
            {
                email: 'admin@restaurant.com',
                password: await bcrypt.hash('admin123', 12),
                firstName: 'Admin',
                lastName: 'User',
                role: UserRole.ADMIN,
                phone: '+1234567890',
                emailVerified: true,
            },
            {
                email: 'kitchen@restaurant.com',
                password: await bcrypt.hash('kitchen123', 12),
                firstName: 'Kitchen',
                lastName: 'Staff',
                role: UserRole.KITCHEN_STAFF,
                phone: '+1234567891',
                emailVerified: true,
            },
            {
                email: 'customer@example.com',
                password: await bcrypt.hash('customer123', 12),
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.CUSTOMER,
                phone: '+1234567892',
                emailVerified: true,
                addresses: [
                    {
                        type: 'home',
                        street: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'US',
                        isDefault: true,
                    }
                ],
                preferences: {
                    notifications: {
                        email: true,
                        sms: false,
                        orderUpdates: true,
                        promotions: true,
                    },
                    dietary: {
                        vegetarian: false,
                        vegan: false,
                        glutenFree: false,
                    }
                }
            }
        ];

        await this.userModel.insertMany(users);
        console.log(`✅ Created ${users.length} users`);
    }

    private async seedCategories() {
        console.log('📂 Seeding categories...');

        const categories = [
            {
                name: 'Appetizers',
                description: 'Start your meal with our delicious appetizers',
                sortOrder: 1,
                isActive: true,
            },
            {
                name: 'Salads',
                description: 'Fresh and healthy salad options',
                sortOrder: 2,
                isActive: true,
            },
            {
                name: 'Main Courses',
                description: 'Hearty main dishes to satisfy your hunger',
                sortOrder: 3,
                isActive: true,
            },
            {
                name: 'Pasta',
                description: 'Italian-inspired pasta dishes',
                sortOrder: 4,
                isActive: true,
            },
            {
                name: 'Pizza',
                description: 'Wood-fired pizzas with fresh ingredients',
                sortOrder: 5,
                isActive: true,
            },
            {
                name: 'Desserts',
                description: 'Sweet endings to your perfect meal',
                sortOrder: 6,
                isActive: true,
            },
            {
                name: 'Beverages',
                description: 'Refreshing drinks and specialty beverages',
                sortOrder: 7,
                isActive: true,
            }
        ];

        const createdCategories = await this.categoryModel.insertMany(categories);
        console.log(`✅ Created ${categories.length} categories`);
        return createdCategories;
    }

    private async seedMenuItems() {
        console.log('🍕 Seeding menu items...');

        // Get categories for reference
        const categories = await this.categoryModel.find({});
        const categoryMap = categories.reduce((map, cat) => {
            map[cat.name] = cat._id;
            return map;
        }, {} as Record<string, any>);

        const menuItems = [
            // Appetizers
            {
                name: 'Buffalo Wings',
                description: 'Crispy chicken wings tossed in spicy buffalo sauce, served with celery and blue cheese',
                categoryId: categoryMap['Appetizers'],
                price: 12.99,
                images: ['/images/buffalo-wings.jpg'],
                isAvailable: true,
                isPopular: true,
                prepTime: 15,
                calories: 450,
                allergens: ['dairy', 'celery'],
                dietaryInfo: {
                    vegetarian: false,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                    nutFree: true,
                    spicy: 3,
                },
                customizations: [
                    {
                        name: 'Sauce Level',
                        type: 'radio',
                        required: true,
                        options: [
                            { name: 'Mild', priceModifier: 0, isAvailable: true },
                            { name: 'Medium', priceModifier: 0, isAvailable: true },
                            { name: 'Hot', priceModifier: 0, isAvailable: true },
                            { name: 'Extra Hot', priceModifier: 1.00, isAvailable: true },
                        ]
                    }
                ],
                tags: ['spicy', 'chicken', 'popular'],
                sortOrder: 1,
            },
            {
                name: 'Mozzarella Sticks',
                description: 'Golden fried mozzarella cheese sticks served with marinara sauce',
                categoryId: categoryMap['Appetizers'],
                price: 8.99,
                images: ['/images/mozzarella-sticks.jpg'],
                isAvailable: true,
                prepTime: 10,
                calories: 320,
                allergens: ['dairy', 'gluten'],
                dietaryInfo: {
                    vegetarian: true,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                    nutFree: true,
                    spicy: 0,
                },
                tags: ['vegetarian', 'cheese'],
                sortOrder: 2,
            },

            // Salads
            {
                name: 'Caesar Salad',
                description: 'Crisp romaine lettuce, parmesan cheese, croutons with classic Caesar dressing',
                categoryId: categoryMap['Salads'],
                price: 11.99,
                images: ['/images/caesar-salad.jpg'],
                isAvailable: true,
                prepTime: 8,
                calories: 280,
                allergens: ['dairy', 'eggs', 'gluten'],
                dietaryInfo: {
                    vegetarian: true,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                    nutFree: true,
                    spicy: 0,
                },
                customizations: [
                    {
                        name: 'Add Protein',
                        type: 'radio',
                        required: false,
                        options: [
                            { name: 'Grilled Chicken', priceModifier: 4.00, isAvailable: true },
                            { name: 'Grilled Salmon', priceModifier: 6.00, isAvailable: true },
                            { name: 'Shrimp', priceModifier: 5.00, isAvailable: true },
                        ]
                    }
                ],
                tags: ['healthy', 'vegetarian'],
                sortOrder: 1,
            },

            // Main Courses
            {
                name: 'Grilled Salmon',
                description: 'Fresh Atlantic salmon grilled to perfection, served with roasted vegetables and rice pilaf',
                categoryId: categoryMap['Main Courses'],
                price: 24.99,
                images: ['/images/grilled-salmon.jpg'],
                isAvailable: true,
                isFeatured: true,
                prepTime: 20,
                calories: 520,
                allergens: ['fish'],
                dietaryInfo: {
                    vegetarian: false,
                    vegan: false,
                    glutenFree: true,
                    dairyFree: true,
                    nutFree: true,
                    spicy: 0,
                },
                customizations: [
                    {
                        name: 'Cooking Style',
                        type: 'radio',
                        required: true,
                        options: [
                            { name: 'Medium', priceModifier: 0, isAvailable: true },
                            { name: 'Medium Well', priceModifier: 0, isAvailable: true },
                            { name: 'Well Done', priceModifier: 0, isAvailable: true },
                        ]
                    }
                ],
                nutritionInfo: {
                    calories: 520,
                    protein: 45,
                    carbs: 25,
                    fat: 28,
                    fiber: 4,
                    sugar: 8,
                    sodium: 680,
                },
                tags: ['healthy', 'gluten-free', 'fish', 'featured'],
                sortOrder: 1,
            },

            // Pizza
            {
                name: 'Margherita Pizza',
                description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
                categoryId: categoryMap['Pizza'],
                price: 16.99,
                images: ['/images/margherita-pizza.jpg'],
                isAvailable: true,
                isPopular: true,
                prepTime: 18,
                calories: 650,
                allergens: ['dairy', 'gluten'],
                dietaryInfo: {
                    vegetarian: true,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                    nutFree: true,
                    spicy: 0,
                },
                customizations: [
                    {
                        name: 'Size',
                        type: 'radio',
                        required: true,
                        options: [
                            { name: 'Small (10")', priceModifier: -4.00, isAvailable: true },
                            { name: 'Medium (12")', priceModifier: 0, isAvailable: true },
                            { name: 'Large (14")', priceModifier: 4.00, isAvailable: true },
                        ]
                    },
                    {
                        name: 'Extra Toppings',
                        type: 'checkbox',
                        required: false,
                        maxSelections: 5,
                        options: [
                            { name: 'Extra Cheese', priceModifier: 2.00, isAvailable: true },
                            { name: 'Pepperoni', priceModifier: 2.50, isAvailable: true },
                            { name: 'Mushrooms', priceModifier: 1.50, isAvailable: true },
                            { name: 'Bell Peppers', priceModifier: 1.50, isAvailable: true },
                            { name: 'Olives', priceModifier: 1.50, isAvailable: true },
                        ]
                    }
                ],
                tags: ['vegetarian', 'popular', 'italian'],
                sortOrder: 1,
            },

            // Pasta
            {
                name: 'Spaghetti Carbonara',
                description: 'Classic Italian pasta with eggs, cheese, pancetta, and black pepper',
                categoryId: categoryMap['Pasta'],
                price: 18.99,
                images: ['/images/carbonara.jpg'],
                isAvailable: true,
                prepTime: 16,
                calories: 580,
                allergens: ['dairy', 'eggs', 'gluten'],
                dietaryInfo: {
                    vegetarian: false,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                    nutFree: true,
                    spicy: 0,
                },
                tags: ['italian', 'pasta'],
                sortOrder: 1,
            },

            // Desserts
            {
                name: 'Chocolate Lava Cake',
                description: 'Warm chocolate cake with molten chocolate center, served with vanilla ice cream',
                categoryId: categoryMap['Desserts'],
                price: 8.99,
                images: ['/images/lava-cake.jpg'],
                isAvailable: true,
                prepTime: 12,
                calories: 420,
                allergens: ['dairy', 'eggs', 'gluten'],
                dietaryInfo: {
                    vegetarian: true,
                    vegan: false,
                    glutenFree: false,
                    dairyFree: false,
                    nutFree: true,
                    spicy: 0,
                },
                tags: ['dessert', 'chocolate', 'warm'],
                sortOrder: 1,
            },

            // Beverages
            {
                name: 'Fresh Lemonade',
                description: 'House-made lemonade with fresh lemons and mint',
                categoryId: categoryMap['Beverages'],
                price: 3.99,
                images: ['/images/lemonade.jpg'],
                isAvailable: true,
                prepTime: 3,
                calories: 120,
                allergens: [],
                dietaryInfo: {
                    vegetarian: true,
                    vegan: true,
                    glutenFree: true,
                    dairyFree: true,
                    nutFree: true,
                    spicy: 0,
                },
                customizations: [
                    {
                        name: 'Style',
                        type: 'radio',
                        required: true,
                        options: [
                            { name: 'Regular', priceModifier: 0, isAvailable: true },
                            { name: 'Sugar-Free', priceModifier: 0, isAvailable: true },
                            { name: 'Extra Sweet', priceModifier: 0.50, isAvailable: true },
                        ]
                    }
                ],
                tags: ['refreshing', 'vegan', 'gluten-free'],
                sortOrder: 1,
            }
        ];

        await this.menuItemModel.insertMany(menuItems);
        console.log(`✅ Created ${menuItems.length} menu items`);
    }
}

// Run seeder
const seeder = new DatabaseSeeder();
seeder.seed().catch(console.error);

// Package.json script to add:
// "db:seed": "ts-node tools/database/seed.ts"