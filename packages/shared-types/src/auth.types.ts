import { UserRole } from "./common.types";
import { User } from "./user.types";

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface AuthResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenDto {
    refreshToken: string;
}

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}