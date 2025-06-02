// apps/api/src/auth/dto/auth-response.dto.ts
import { UserRole } from '@restaurant-pos/shared-types';
import { IsString } from 'class-validator';

export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
        isActive: boolean;
        isEmailVerified: boolean;
    };
    expiresIn: number;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}