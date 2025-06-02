import {
    IsEmail,
    IsString,
    MinLength,
    IsEnum,
    IsOptional,
    Matches,
    IsNotEmpty
} from 'class-validator';
import { UserRole } from '@restaurant-pos/shared-types';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @IsString()
    @Matches(/^\+?[\d\s\-\(\)]+$/, { message: 'Please enter a valid phone number' })
    phone: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole = UserRole.CUSTOMER;
}