import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConvertToMotherDto {
  @ApiProperty({
    description: 'Optional notes about converting this plant to a mother plant',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
