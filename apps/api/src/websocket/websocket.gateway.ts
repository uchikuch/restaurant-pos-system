import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        credentials: true,
    },
})
export class RestaurantWebSocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('WebSocketGateway');
    private userSocketMap = new Map<string, string>(); // userId -> socketId
    private socketUserMap = new Map<string, string>(); // socketId -> userId

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway Initialized');
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without auth`);
                // Allow connection but don't map to user
                return;
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            const userId = payload.sub || payload.id;

            // Store the mapping
            this.userSocketMap.set(userId, client.id);
            this.socketUserMap.set(client.id, userId);

            // Join user-specific room
            client.join(`user:${userId}`);

            // Join role-specific room
            if (payload.role) {
                client.join(`role:${payload.role}`);
            }

            this.logger.log(`Client ${client.id} connected as user ${userId}`);
        } catch (error) {
            this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
        }
    }

    handleDisconnect(client: Socket) {
        const userId = this.socketUserMap.get(client.id);
        if (userId) {
            this.userSocketMap.delete(userId);
            this.socketUserMap.delete(client.id);
        }
        this.logger.log(`Client ${client.id} disconnected`);
    }

    // Subscribe to order updates for a specific order
    @SubscribeMessage('subscribe:order')
    handleSubscribeToOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() orderId: string,
    ) {
        client.join(`order:${orderId}`);
        this.logger.log(`Client ${client.id} subscribed to order ${orderId}`);
        return { event: 'subscribed', data: { orderId } };
    }

    // Unsubscribe from order updates
    @SubscribeMessage('unsubscribe:order')
    handleUnsubscribeFromOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() orderId: string,
    ) {
        client.leave(`order:${orderId}`);
        this.logger.log(`Client ${client.id} unsubscribed from order ${orderId}`);
        return { event: 'unsubscribed', data: { orderId } };
    }

    // Subscribe to kitchen updates (for kitchen dashboard)
    @SubscribeMessage('subscribe:kitchen')
    handleSubscribeToKitchen(@ConnectedSocket() client: Socket) {
        client.join('kitchen');
        this.logger.log(`Client ${client.id} subscribed to kitchen updates`);
        return { event: 'subscribed', data: { channel: 'kitchen' } };
    }

    // Server-side methods to emit events (called from services)

    // Emit to specific user
    emitToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    // Emit to specific order room
    emitToOrder(orderId: string, event: string, data: any) {
        this.server.to(`order:${orderId}`).emit(event, data);
    }

    // Emit to kitchen
    emitToKitchen(event: string, data: any) {
        this.server.to('kitchen').emit(event, data);
    }

    // Emit to role
    emitToRole(role: string, event: string, data: any) {
        this.server.to(`role:${role}`).emit(event, data);
    }

    // Emit to all connected clients
    emitToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    // Order-related events
    notifyOrderCreated(order: any) {
        // Notify kitchen
        this.emitToKitchen('order:created', order);

        // Notify admins
        this.emitToRole('admin', 'order:created', order);

        // Notify the customer
        if (order.user) {
            this.emitToUser(order.user.toString(), 'order:created', order);
        }
    }

    notifyOrderStatusChanged(order: any) {
        // Notify everyone subscribed to this order
        this.emitToOrder(order._id.toString(), 'order:status_changed', {
            orderId: order._id,
            status: order.status,
            statusHistory: order.statusHistory,
        });

        // Notify kitchen if relevant
        if (['confirmed', 'preparing', 'ready'].includes(order.status)) {
            this.emitToKitchen('order:status_changed', order);
        }

        // Notify the customer
        if (order.user) {
            this.emitToUser(order.user.toString(), 'order:status_changed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
            });
        }
    }

    notifyPaymentCompleted(order: any) {
        // Notify the order room
        this.emitToOrder(order._id.toString(), 'payment:completed', {
            orderId: order._id,
            paymentStatus: order.paymentStatus,
        });

        // Notify kitchen that payment is confirmed
        this.emitToKitchen('payment:completed', {
            orderId: order._id,
            orderNumber: order.orderNumber,
        });

        // Notify the customer
        if (order.user) {
            this.emitToUser(order.user.toString(), 'payment:completed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
            });
        }
    }

    notifyOrderReady(order: any) {
        // Special notification for order ready
        if (order.user) {
            this.emitToUser(order.user.toString(), 'order:ready', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                message: `Your order ${order.orderNumber} is ready for pickup!`,
            });
        }

        // Also emit to order room
        this.emitToOrder(order._id.toString(), 'order:ready', {
            orderId: order._id,
            orderNumber: order.orderNumber,
        });
    }
}