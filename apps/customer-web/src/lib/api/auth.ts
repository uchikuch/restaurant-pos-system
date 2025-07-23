// lib/api/auth.ts
import { api, setTokens, clearTokens } from './client';
import {
    User,
    UserRole
} from '@restaurant-pos/shared-types';

// Define DTOs based on what the API expects
interface LoginDto {
    email: string;
    password: string;
}

interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
}

interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

interface ProfileResponse {
    user: User;
}

export const authApi = {
    // Register new user
    register: async (data: RegisterDto): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);

        // Store tokens
        setTokens(response.accessToken, response.refreshToken);

        return response;
    },

    // Login user
    login: async (data: LoginDto): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);

        // Store tokens
        setTokens(response.accessToken, response.refreshToken);

        return response;
    },

    // Get current user profile
    getProfile: async (): Promise<User> => {
        const response = await api.get<ProfileResponse>('/auth/profile');
        return response.user;
    },

    // Change password
    changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
        return api.patch('/auth/change-password', data);
    },

    // Logout
    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Even if API call fails, clear local tokens
            console.error('Logout API error:', error);
        } finally {
            clearTokens();
            // Redirect to home or login page
            window.location.href = '/';
        }
    },

    // Refresh token (usually handled by interceptor, but exposed for manual use)
    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });

        // Store new tokens
        setTokens(response.accessToken, response.refreshToken);

        return response;
    },
};

// Helper function to check if user has specific role
export const hasRole = (user: User | null, role: UserRole): boolean => {
    return user?.role === role;
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('access_token');
};