import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'User UUID', example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'User full name', example: 'John Doe' })
  name?: string | null;

  @ApiPropertyOptional({ description: 'List of role names assigned to the user', example: ['licensee_admin'] })
  roles?: string[];

  @ApiPropertyOptional({ description: 'List of location UUIDs the user is associated with', example: ['33333333-3333-3333-3333-333333333333'] })
  locationIds?: string[];

  @ApiPropertyOptional({ description: 'Account status (active/inactive)', example: 'active' })
  status?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp when the user was created' })
  createdAt?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp when the user was last updated' })
  updatedAt?: string;
}