import { UserRole } from "./common.types";
export interface User {
    _id: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    avatar?: string;
    addresses?: Address[];
    preferences?: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
}
export interface Address {
    _id: string;
    type: 'home' | 'work' | 'other';
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
    instructions?: string;
}
export interface UserPreferences {
    notifications: {
        email: boolean;
        sms: boolean;
        orderUpdates: boolean;
        promotions: boolean;
    };
    dietary: {
        vegetarian?: boolean;
        vegan?: boolean;
        glutenFree?: boolean;
        dairyFree?: boolean;
        nutFree?: boolean;
        other?: string[];
    };
}
export interface CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
}
export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    addresses?: Address[];
    preferences?: UserPreferences;
}
