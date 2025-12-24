import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoomMoveDto {
  @ApiProperty({
    description: 'UUID of the destination room',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    format: 'uuid',
  })
  @IsUUID()
  toRoomId: string;

  @ApiPropertyOptional({
    description: 'UUID of the source room (optional)',
    example: 'a3f2c8ae-5f8d-4d6f-9b12-0123456789ab',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fromRoomId?: string;
}