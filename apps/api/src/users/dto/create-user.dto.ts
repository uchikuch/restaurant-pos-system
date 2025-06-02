import {
    IsEmail,
    IsString,
    MinLength,
    IsEnum,
    IsOptional,
    IsArray,
    ValidateNested,
    IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@restaurant-pos/shared-types';

class AddressDto {
    @IsString()
    street: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    zipCode: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;

    @IsOptional()
    @IsString()
    label?: string;
}

class PreferencesDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    dietaryRestrictions?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    favoriteCategories?: string[];

    @IsOptional()
    @IsEnum(['mild', 'medium', 'hot', 'extra-hot'])
    spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
}

export class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddressDto)
    addresses?: AddressDto[];

    @IsOptional()
    @ValidateNested()
    @Type(() => PreferencesDto)
    preferences?: PreferencesDto;

    // Staff specific fields
    @IsOptional()
    @IsString()
    employeeId?: string;

    @IsOptional()
    @IsString()
    department?: string;
}