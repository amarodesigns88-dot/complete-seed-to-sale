import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveItemRoomDto {
  @ApiProperty({ description: 'Target room ID' })
  @IsUUID()
  @IsNotEmpty()
  targetRoomId: string;

  @ApiProperty({ description: 'Reason for room movement', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
