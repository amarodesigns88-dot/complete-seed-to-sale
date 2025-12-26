import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TransferStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  REJECTED = 'REJECTED',
}

export class TransferItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CreateTransferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationLocationId: string;

  @ApiProperty({ type: [TransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty()
  @IsDateString()
  estimatedArrival: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceiveTransferDto {
  @ApiProperty({ enum: ['RECEIVED', 'REJECTED'] })
  @IsEnum(['RECEIVED', 'REJECTED'])
  status: 'RECEIVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class RegisterDriverDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;
}

export class RegisterVehicleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty()
  @IsNumber()
  year: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vin?: string;
}

export class TransferFilterDto {
  @ApiPropertyOptional({ enum: TransferStatus })
  @IsEnum(TransferStatus)
  @IsOptional()
  status?: TransferStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  destinationLocationId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
