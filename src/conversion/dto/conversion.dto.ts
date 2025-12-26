import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsOptional, IsEnum, Min, IsDateString } from 'class-validator';

export enum ConversionType {
  WET_TO_DRY = 'WET_TO_DRY',
  DRY_TO_EXTRACTION = 'DRY_TO_EXTRACTION',
  EXTRACTION_TO_FINISHED = 'EXTRACTION_TO_FINISHED',
}

export class WetToDryConversionDto {
  @ApiProperty({ description: 'Source wet inventory item ID' })
  @IsUUID()
  sourceInventoryId: string;

  @ApiProperty({ description: 'Output inventory type ID for dry product' })
  @IsUUID()
  outputInventoryTypeId: string;

  @ApiProperty({ description: 'Input wet weight in grams' })
  @IsNumber()
  @Min(0.01)
  inputWeightGrams: number;

  @ApiProperty({ description: 'Output dry weight in grams' })
  @IsNumber()
  @Min(0.01)
  outputWeightGrams: number;

  @ApiProperty({ description: 'Room ID where conversion takes place' })
  @IsUUID()
  roomId: string;

  @ApiPropertyOptional({ description: 'Strain ID' })
  @IsUUID()
  @IsOptional()
  strainId?: string;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Notes about the conversion' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DryToExtractionConversionDto {
  @ApiProperty({ description: 'Source dry inventory item ID' })
  @IsUUID()
  sourceInventoryId: string;

  @ApiProperty({ description: 'Output inventory type ID for extraction product' })
  @IsUUID()
  outputInventoryTypeId: string;

  @ApiProperty({ description: 'Input dry weight in grams' })
  @IsNumber()
  @Min(0.01)
  inputWeightGrams: number;

  @ApiProperty({ description: 'Output extraction weight in grams' })
  @IsNumber()
  @Min(0.01)
  outputWeightGrams: number;

  @ApiProperty({ description: 'Room ID where conversion takes place' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ description: 'Extraction method', example: 'CO2, Ethanol, Hydrocarbon' })
  @IsString()
  extractionMethod: string;

  @ApiPropertyOptional({ description: 'Strain ID' })
  @IsUUID()
  @IsOptional()
  strainId?: string;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Notes about the conversion' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ExtractionToFinishedConversionDto {
  @ApiProperty({ description: 'Source extraction inventory item ID' })
  @IsUUID()
  sourceInventoryId: string;

  @ApiProperty({ description: 'Output inventory type ID for finished goods' })
  @IsUUID()
  outputInventoryTypeId: string;

  @ApiProperty({ description: 'Input extraction weight in grams' })
  @IsNumber()
  @Min(0.01)
  inputWeightGrams: number;

  @ApiProperty({ description: 'Output product weight in grams' })
  @IsNumber()
  @Min(0.01)
  outputWeightGrams: number;

  @ApiProperty({ description: 'Usable weight in grams for finished goods' })
  @IsNumber()
  @Min(0.01)
  usableWeightGrams: number;

  @ApiProperty({ description: 'Room ID where conversion takes place' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ description: 'Number of units produced' })
  @IsNumber()
  @Min(1)
  unitsProduced: number;

  @ApiPropertyOptional({ description: 'Strain ID' })
  @IsUUID()
  @IsOptional()
  strainId?: string;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsString()
  @IsOptional()
  productSku?: string;

  @ApiPropertyOptional({ description: 'Notes about the conversion' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConversionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by conversion type' })
  @IsEnum(ConversionType)
  @IsOptional()
  conversionType?: ConversionType;

  @ApiPropertyOptional({ description: 'Filter by strain ID' })
  @IsUUID()
  @IsOptional()
  strainId?: string;

  @ApiPropertyOptional({ description: 'Filter by room ID' })
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Filter conversions after this date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter conversions before this date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  perPage?: number;
}
