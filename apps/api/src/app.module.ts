// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { OrderModule } from './orders/order.module';
import { CartModule } from './cart/cart.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    // Configuration module - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection with Mongoose - using ConfigService for better practices
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL') || 'mongodb://localhost:27017/restaurant-pos',
        // Connection options for production readiness
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
    }),

    // Authentication and user management modules
    AuthModule,
    UsersModule,

    // Menu management modules
    CategoriesModule,
    MenuItemsModule,

    // Order processing module
    OrderModule,

    // Shopping cart module
    CartModule,

    // Loyalty program module
    LoyaltyModule,

    // Payment processing module
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JWT guard globally - protects all routes by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }