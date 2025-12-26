import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UndoOperationDto {
  @ApiProperty({ description: 'Reason for undoing the operation' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
