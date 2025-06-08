// apps/api/src/users/dto/create-user.dto.ts
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

class NotificationPreferencesDto {
    @IsOptional()
    @IsBoolean()
    email?: boolean;

    @IsOptional()
    @IsBoolean()
    sms?: boolean;

    @IsOptional()
    @IsBoolean()
    orderUpdates?: boolean;

    @IsOptional()
    @IsBoolean()
    promotions?: boolean;
}

class DietaryPreferencesDto {
    @IsOptional()
    @IsBoolean()
    vegetarian?: boolean;

    @IsOptional()
    @IsBoolean()
    vegan?: boolean;

    @IsOptional()
    @IsBoolean()
    glutenFree?: boolean;

    @IsOptional()
    @IsBoolean()
    dairyFree?: boolean;

    @IsOptional()
    @IsBoolean()
    nutFree?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    other?: string[];
}

class PreferencesDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationPreferencesDto)
    notifications?: NotificationPreferencesDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => DietaryPreferencesDto)
    dietary?: DietaryPreferencesDto;
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

    @IsOptional()
    @IsString()
    phone?: string;

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