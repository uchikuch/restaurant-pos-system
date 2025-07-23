// hooks/useAuth.ts
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import wsClient from '@/lib/api/websocket';

interface UseAuthOptions {
    redirectTo?: string;
    redirectIfFound?: boolean;
}

export function useAuth(options?: UseAuthOptions) {
    const router = useRouter();
    const {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        fetchProfile
    } = useAuthStore();

    useEffect(() => {
        // If we have a token but no user data, fetch the profile
        if (isAuthenticated && !user && !isLoading) {
            fetchProfile();
        }

        // Connect WebSocket if authenticated
        if (isAuthenticated && !wsClient.isConnected()) {
            wsClient.connect();
        }
    }, [isAuthenticated, user, isLoading, fetchProfile]);

    useEffect(() => {
        if (!isLoading && options?.redirectTo) {
            if (
                // If redirectTo is set, redirect if user is not authenticated
                (options.redirectTo && !options.redirectIfFound && !isAuthenticated) ||
                // If redirectIfFound is true, redirect if user is authenticated
                (options.redirectIfFound && isAuthenticated)
            ) {
                router.push(options.redirectTo);
            }
        }
    }, [isAuthenticated, isLoading, options, router]);

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
    };
}

// Hook for pages that require authentication
export function useRequireAuth(redirectTo: string = '/login') {
    return useAuth({ redirectTo });
}

// Hook for pages that should redirect if user is already authenticated
export function useRedirectIfAuthenticated(redirectTo: string = '/') {
    return useAuth({ redirectTo, redirectIfFound: true });
}