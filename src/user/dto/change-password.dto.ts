import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password (required when a user changes their own password)', example: 'OldP@ssw0rd' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password (min length 8)', example: 'NewP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}