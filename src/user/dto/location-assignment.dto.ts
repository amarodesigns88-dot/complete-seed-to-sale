import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LocationAssignmentDto {
  @ApiProperty({
    description: 'Array of location UUIDs to set for the user (replaces existing locations).',
    example: ['33333333-3333-3333-3333-333333333333'],
    isArray: true,
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  locationIds: string[];
}