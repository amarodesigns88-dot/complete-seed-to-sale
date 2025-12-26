import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class MovePlantRoomDto {
  @ApiProperty({
    description: 'Target room ID to move the plant to',
  })
  @IsUUID()
  toRoomId: string;

  @ApiProperty({
    description: 'Optional notes about the room move',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
