import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LOCATION_MODULE_KEY } from './location.decorator';

@Injectable()
export class LocationModuleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required modules from route metadata
    const requiredModules = this.reflector.get<string[]>(
      LOCATION_MODULE_KEY,
      context.getHandler(),
    );

    if (!requiredModules || requiredModules.length === 0) {
      // No module restrictions on this route
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Extract locationId dynamically from route params
    const locationId = request.params.locationId || user.parentLocationId;

    if (!locationId) {
      throw new ForbiddenException('Location ID not specified');
    }

    // User's permissions from JWT payload
    const userPermissions: { locationId: string; modules: string[] }[] =
      user.permissions || [];

    // Find permissions for the dynamic locationId
    const permissionForLocation = userPermissions.find(
      (perm) => perm.locationId === locationId,
    );

    if (!permissionForLocation) {
      throw new ForbiddenException(
        `Access denied: no permissions for location ${locationId}`,
      );
    }

    // Check if user has all required modules for this location
    const hasAllModules = requiredModules.every((mod) =>
      permissionForLocation.modules.includes(mod),
    );

    if (!hasAllModules) {
      throw new ForbiddenException(
        `Access denied: insufficient module permissions for location ${locationId}`,
      );
    }

    return true;
  }
}