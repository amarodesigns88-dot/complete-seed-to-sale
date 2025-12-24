import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoleAssignmentDto {
  @ApiProperty({
    description: 'Array of role UUIDs to set for the user (replaces existing roles).',
    example: ['11111111-1111-1111-1111-111111111111'],
    isArray: true,
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  roleIds: string[];
}