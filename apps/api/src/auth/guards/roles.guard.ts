import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@restaurant-pos/shared-types';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // No roles required
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`
            );
        }

        return true;
    }
}