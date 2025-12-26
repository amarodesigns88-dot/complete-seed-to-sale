import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AccessibleUbiDto {
  @ApiProperty({
    description: 'List of UBI identifiers the user can access',
    example: ['UBI-001', 'UBI-002', 'UBI-003'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  ubis: string[];
}
