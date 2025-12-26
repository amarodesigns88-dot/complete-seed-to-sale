import { ApiProperty } from '@nestjs/swagger';

export class UserPermissionResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Effective permissions for the user based on roles',
    example: {
      canCreatePlants: true,
      canEditInventory: true,
      canViewReports: true,
      canManageUsers: false,
    },
  })
  permissions: Record<string, boolean>;

  @ApiProperty({
    description: 'List of role names',
    example: ['licensee_user', 'cultivator'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Accessible modules for this user',
    example: ['cultivation', 'inventory', 'sales'],
    type: [String],
  })
  modules: string[];
}
