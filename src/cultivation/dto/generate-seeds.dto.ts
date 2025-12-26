import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class GenerateSeedsDto {
  @ApiProperty({
    description: 'Number of seeds to generate from the mother plant',
    example: 50,
  })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Room ID where seeds will be stored',
  })
  @IsUUID()
  roomId: string;

  @ApiProperty({
    description: 'Optional batch identifier for the seeds',
    required: false,
  })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({
    description: 'Optional notes about the seed generation',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
