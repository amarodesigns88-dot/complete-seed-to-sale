import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class GenerateClonesDto {
  @ApiProperty({
    description: 'Number of clones to generate from the mother plant',
    example: 10,
  })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Room ID where clones will be placed',
  })
  @IsUUID()
  roomId: string;

  @ApiProperty({
    description: 'Optional batch identifier for the clones',
    required: false,
  })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({
    description: 'Optional notes about the clone generation',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
