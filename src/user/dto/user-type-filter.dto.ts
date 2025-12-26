import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum UserType {
  ADMIN = 'Admin',
  STATE = 'State',
  LICENSEE = 'Licensee',
}

export class UserTypeFilterDto {
  @ApiProperty({
    description: 'User type to filter by',
    example: 'Licensee',
    enum: UserType,
  })
  @IsNotEmpty()
  @IsEnum(UserType)
  userType: UserType;
}
