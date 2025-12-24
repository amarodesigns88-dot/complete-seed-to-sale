import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'New password to set (admin-reset), minLength 8', example: 'NewP@ssw0rd!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}