import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UndoOperationDto {
  @ApiProperty({
    description: 'Optional reason for undoing the operation',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
