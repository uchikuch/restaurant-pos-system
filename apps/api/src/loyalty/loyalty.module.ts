import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyAccount, LoyaltyAccountSchema } from './schemas/loyalty.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: LoyaltyAccount.name, schema: LoyaltyAccountSchema },
            { name: User.name, schema: UserSchema },
            { name: Order.name, schema: OrderSchema }
        ])
    ],
    controllers: [LoyaltyController],
    providers: [LoyaltyService],
    exports: [LoyaltyService]
})
export class LoyaltyModule { }