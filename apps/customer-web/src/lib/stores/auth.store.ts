// lib/stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '@restaurant-pos/shared-types';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';
import wsClient from '../api/websocket';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateUser: (user: User) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isAuthenticated: false,

            login: async (credentials) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login(credentials);

                    set({
                        user: response.user,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    // Connect WebSocket after successful login
                    wsClient.connect();

                    toast.success(`Welcome back, ${response.user.firstName}!`);
                } catch (error: unknown) {
                    set({ isLoading: false });

                    if (error instanceof Error && 'response' in error) {
                        const axiosError = error as { response?: { status?: number } };
                        if (axiosError.response?.status === 401) {
                            toast.error('Invalid email or password');
                        } else {
                            toast.error('Login failed. Please try again.');
                        }
                    } else {
                        toast.error('Login failed. Please try again.');
                    }

                    throw error;
                }
            },

            register: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.register({
                        ...data,
                        role: UserRole.CUSTOMER // Use the enum value
                    });

                    set({
                        user: response.user,
                        isAuthenticated: true,
                        isLoading: false
                    });

                    // Connect WebSocket after successful registration
                    wsClient.connect();

                    toast.success(`Welcome, ${response.user.firstName}!`);
                } catch (error: unknown) {
                    set({ isLoading: false });

                    if (error instanceof Error && 'response' in error) {
                        const axiosError = error as { response?: { data?: { message?: string } } };
                        if (axiosError.response?.data?.message) {
                            toast.error(axiosError.response.data.message);
                        } else {
                            toast.error('Registration failed. Please try again.');
                        }
                    } else {
                        toast.error('Registration failed. Please try again.');
                    }

                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    // Clear state regardless of API response
                    get().clearAuth();

                    // Disconnect WebSocket
                    wsClient.disconnect();

                    toast.success('Logged out successfully');
                }
            },

            fetchProfile: async () => {
                if (!get().isAuthenticated) return;

                set({ isLoading: true });
                try {
                    const user = await authApi.getProfile();
                    set({ user, isLoading: false });
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    set({ isLoading: false });

                    // If profile fetch fails, likely token is invalid
                    if (error instanceof Error && 'response' in error) {
                        const axiosError = error as { response?: { status?: number } };
                        if (axiosError.response?.status === 401) {
                            get().clearAuth();
                        }
                    }
                }
            },

            updateUser: (user) => {
                set({ user });
            },

            clearAuth: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);