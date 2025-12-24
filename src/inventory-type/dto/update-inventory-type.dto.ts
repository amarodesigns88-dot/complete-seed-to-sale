import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateInventoryTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isSource?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}