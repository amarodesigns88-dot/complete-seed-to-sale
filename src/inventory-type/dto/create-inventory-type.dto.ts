import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateInventoryTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  unit: string;

  @IsBoolean()
  isSource: boolean;
}