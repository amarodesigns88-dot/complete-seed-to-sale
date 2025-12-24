import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomDto {
  @ApiPropertyOptional({
    description: 'Updated room name',
    example: 'Flower Room B-2',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated room type (e.g., "flower", "veg", "mother", "dry")',
    example: 'veg',
  })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({
    description: 'Updated room status (e.g., "active", "inactive", "quarantine")',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Updated JSON metadata for the room (e.g., sensors, notes, capacity)',
    example: { capacity: 150, climateController: 'CC-43', notes: 'Near exhaust' },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}