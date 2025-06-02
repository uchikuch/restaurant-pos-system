// apps/api/src/users/users.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from '@restaurant-pos/shared-types';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        try {
            // Check if user already exists
            const existingUser = await this.findByEmail(createUserDto.email);
            if (existingUser) {
                throw new ConflictException('User with this email already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

            // Create user
            const user = new this.userModel({
                ...createUserDto,
                password: hashedPassword,
            });

            return await user.save();
        } catch (error) {
            if (error.code === 11000) {
                // MongoDB duplicate key error
                throw new ConflictException('User with this email already exists');
            }
            throw error;
        }
    }

    async findAll(page: number = 1, limit: number = 10, role?: UserRole): Promise<{
        users: UserDocument[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;
        const filter = role ? { role } : {};

        const [users, total] = await Promise.all([
            this.userModel
                .find(filter)
                .select('-password -refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(filter)
        ]);

        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findById(id: string): Promise<UserDocument | null> {
        try {
            return await this.userModel
                .findById(id)
                .select('-password -refreshToken')
                .exec();
        } catch (error) {
            return null;
        }
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return await this.userModel
            .findOne({ email: email.toLowerCase() })
            .exec();
    }

    async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
        return await this.userModel
            .findOne({ email: email.toLowerCase() })
            .select('+password')
            .exec();
    }

    async updateById(id: string, updateData: Partial<CreateUserDto>): Promise<UserDocument> {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // If password is being updated, hash it
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 12);
        }

        // If email is being updated, check for duplicates
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await this.findByEmail(updateData.email);
            if (existingUser) {
                throw new ConflictException('User with this email already exists');
            }
        }

        return await this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .select('-password -refreshToken')
            .exec();
    }

    async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
        const hashedRefreshToken = refreshToken ? await bcrypt.hash(refreshToken, 12) : null;

        await this.userModel
            .findByIdAndUpdate(userId, { refreshToken: hashedRefreshToken })
            .exec();
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.userModel
            .findByIdAndUpdate(userId, { lastLoginAt: new Date() })
            .exec();
    }

    async verifyEmail(userId: string): Promise<UserDocument> {
        const user = await this.userModel
            .findByIdAndUpdate(
                userId,
                {
                    isEmailVerified: true,
                    emailVerificationToken: undefined
                },
                { new: true }
            )
            .select('-password -refreshToken')
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async deactivateUser(id: string): Promise<UserDocument> {
        const user = await this.userModel
            .findByIdAndUpdate(
                id,
                {
                    isActive: false,
                    refreshToken: null
                },
                { new: true }
            )
            .select('-password -refreshToken')
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async activateUser(id: string): Promise<UserDocument> {
        const user = await this.userModel
            .findByIdAndUpdate(
                id,
                { isActive: true },
                { new: true }
            )
            .select('-password -refreshToken')
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async deleteUser(id: string): Promise<void> {
        const result = await this.userModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException('User not found');
        }
    }

    async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
        const user = await this.userModel
            .findById(userId)
            .select('refreshToken')
            .exec();

        if (!user?.refreshToken) {
            return false;
        }

        return await bcrypt.compare(refreshToken, user.refreshToken);
    }

    // Staff-specific methods
    async findStaffMembers(): Promise<UserDocument[]> {
        return await this.userModel
            .find({
                role: { $in: [UserRole.KITCHEN_STAFF, UserRole.ADMIN] },
                isActive: true
            })
            .select('-password -refreshToken')
            .sort({ firstName: 1 })
            .exec();
    }

    async updateStaffInfo(id: string, staffData: {
        employeeId?: string;
        department?: string;
        hireDate?: Date;
    }): Promise<UserDocument> {
        return await this.updateById(id, staffData);
    }

    // Customer-specific methods
    async addAddress(userId: string, address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        isDefault?: boolean;
        label?: string;
    }): Promise<UserDocument> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Set defaults for optional fields
        const newAddress = {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            isDefault: address.isDefault ?? false,
            label: address.label ?? 'Home'
        };

        // If this is the default address, unset others
        if (newAddress.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(newAddress);
        await user.save();

        return await this.findById(userId);
    }

    async updateAddress(
        userId: string,
        addressIndex: number,
        updateData: Partial<{
            street: string;
            city: string;
            state: string;
            zipCode: string;
            isDefault: boolean;
            label: string;
        }>
    ): Promise<UserDocument> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (addressIndex < 0 || addressIndex >= user.addresses.length) {
            throw new BadRequestException('Invalid address index');
        }

        // If setting as default, unset others
        if (updateData.isDefault === true) {
            user.addresses.forEach((addr, index) => {
                if (index !== addressIndex) {
                    addr.isDefault = false;
                }
            });
        }

        // Update the address with proper handling of optional fields
        const currentAddress = user.addresses[addressIndex];
        Object.assign(currentAddress, {
            street: updateData.street ?? currentAddress.street,
            city: updateData.city ?? currentAddress.city,
            state: updateData.state ?? currentAddress.state,
            zipCode: updateData.zipCode ?? currentAddress.zipCode,
            isDefault: updateData.isDefault ?? currentAddress.isDefault,
            label: updateData.label ?? currentAddress.label,
        });

        await user.save();
        return await this.findById(userId);
    }

    async removeAddress(userId: string, addressIndex: number): Promise<UserDocument> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (addressIndex < 0 || addressIndex >= user.addresses.length) {
            throw new BadRequestException('Invalid address index');
        }

        user.addresses.splice(addressIndex, 1);
        await user.save();

        return await this.findById(userId);
    }
}