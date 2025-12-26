import { ApiProperty } from '@nestjs/swagger';

export class UserPermissionsDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User type (Admin, State, Licensee)',
    example: 'Licensee',
    enum: ['Admin', 'State', 'Licensee'],
  })
  userType: 'Admin' | 'State' | 'Licensee';

  @ApiProperty({
    description: 'List of accessible UBIs for the user',
    example: ['UBI-001', 'UBI-002'],
    type: [String],
  })
  accessibleUbis: string[];

  @ApiProperty({
    description: 'List of roles assigned to the user',
    example: ['licensee_user', 'cultivator'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'List of permissions/modules the user can access',
    example: ['cultivation', 'inventory', 'sales'],
    type: [String],
  })
  modules: string[];

  @ApiProperty({
    description: 'Whether user has read-only access',
    example: false,
  })
  isReadOnly: boolean;
}
