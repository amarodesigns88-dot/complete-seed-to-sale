import { SetMetadata } from '@nestjs/common';

export const LOCATION_MODULE_KEY = 'location_module_permissions';

/**
 * Decorator to specify required modules for a route.
 * LocationId will be dynamically extracted from request params.
 * 
 * @param modules Array of required module names for the location.
 * Example:
 * ['cultivation', 'inventory']
 */
export const LocationModulePermissions = (modules: string[]) =>
  SetMetadata(LOCATION_MODULE_KEY, modules);