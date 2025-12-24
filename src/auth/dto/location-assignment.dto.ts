import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class LocationAssignmentDto {
  @ApiProperty({
    description: 'Array of location IDs to assign to the user',
    example: ['33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'],
    isArray: true,
  })
  @IsArray()
  @IsUUID('all', { each: true })
  locationIds: string[];
}