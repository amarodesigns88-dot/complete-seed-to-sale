import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Look for roles metadata on handler or class
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required -> allow
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debugging logs (remove or change to logger.debug in production)
    console.log('RolesGuard -> requiredRoles:', requiredRoles);
    console.log('RolesGuard -> request.user:', user);

    if (!user) {
      // If user is missing, the JwtAuthGuard likely didn't run or failed
      throw new ForbiddenException('Access denied: user not authenticated');
    }

    // allow if any required role matches user's role
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}