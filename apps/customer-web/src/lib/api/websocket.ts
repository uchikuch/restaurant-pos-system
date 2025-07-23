// lib/api/websocket.ts
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './client';
import toast from 'react-hot-toast';

class WebSocketClient {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    connect(): Socket {
        if (this.socket?.connected) {
            return this.socket;
        }

        const token = getAccessToken();

        this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
        });

        this.setupEventListeners();

        return this.socket;
    }

    private setupEventListeners(): void {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;

            // Rejoin any active rooms/subscriptions
            const token = getAccessToken();
            if (token) {
                this.socket?.emit('authenticate', { token });
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);

            if (reason === 'io server disconnect') {
                // Server initiated disconnect, attempt to reconnect
                this.reconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);

            if (error.message === 'Unauthorized') {
                // Token might be expired, try to refresh
                this.disconnect();
                // Could trigger token refresh here
            }
        });

        // Order events
        this.socket.on('order:created', (data) => {
            console.log('New order created:', data);
            // Handle new order notification
        });

        this.socket.on('order:status_changed', (data) => {
            console.log('Order status changed:', data);
            toast.success(`Order ${data.orderNumber} is now ${data.status}`);
        });

        this.socket.on('order:ready', (data) => {
            console.log('Order ready:', data);
            toast.success(`Your order ${data.orderNumber} is ready for pickup!`, {
                duration: 6000,
            });
        });

        // Payment events
        this.socket.on('payment:completed', (data) => {
            console.log('Payment completed:', data);
            toast.success('Payment successful!');
        });

        this.socket.on('payment:failed', (data) => {
            console.log('Payment failed:', data);
            toast.error('Payment failed. Please try again.');
        });

        this.socket.on('payment:refunded', (data) => {
            console.log('Payment refunded:', data);
            toast(`Refund processed for order ${data.orderNumber}`, {
                icon: 'ℹ️',
                duration: 5000,
            });
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            toast.error('Connection error. Please refresh the page.');
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    private reconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            toast.error('Unable to connect to server. Please refresh the page.');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        setTimeout(() => {
            console.log(`Reconnection attempt ${this.reconnectAttempts}`);
            this.connect();
        }, delay);
    }

    // Subscribe to order updates
    subscribeToOrder(orderId: string): void {
        if (!this.socket?.connected) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('subscribe:order', { orderId });
    }

    // Unsubscribe from order updates
    unsubscribeFromOrder(orderId: string): void {
        if (!this.socket?.connected) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('unsubscribe:order', { orderId });
    }

    // Send custom event
    emit(event: string, data?: unknown): void {
        if (!this.socket?.connected) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit(event, data);
    }

    // Listen to custom event
    on(event: string, callback: (...args: unknown[]) => void): void {
        if (!this.socket) {
            console.error('WebSocket not initialized');
            return;
        }

        this.socket.on(event, callback);
    }

    // Remove event listener
    off(event: string, callback?: (...args: unknown[]) => void): void {
        if (!this.socket) {
            console.error('WebSocket not initialized');
            return;
        }

        this.socket.off(event, callback);
    }

    // Get socket instance
    getSocket(): Socket | null {
        return this.socket;
    }

    // Check if connected
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Create singleton instance
const wsClient = new WebSocketClient();

export default wsClient;