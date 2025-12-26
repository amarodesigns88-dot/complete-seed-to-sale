import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';

export enum SampleType {
  COMPLIANCE = 'COMPLIANCE',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
  RESEARCH = 'RESEARCH',
}

export enum RemediationType {
  RETESTING = 'RETESTING',
  DESTRUCTION = 'DESTRUCTION',
  REPROCESSING = 'REPROCESSING',
}

export class GenerateSampleDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsNotEmpty()
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ enum: SampleType, description: 'Type of sample' })
  @IsNotEmpty()
  @IsEnum(SampleType)
  sampleType: SampleType;

  @ApiProperty({ description: 'Sample size in grams' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.1)
  sampleSizeGrams: number;

  @ApiPropertyOptional({ description: 'Notes about the sample' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignLabDto {
  @ApiProperty({ description: 'Sample ID' })
  @IsNotEmpty()
  @IsUUID()
  sampleId: string;

  @ApiProperty({ description: 'Lab facility name' })
  @IsNotEmpty()
  @IsString()
  labName: string;

  @ApiProperty({ description: 'Lab contact email' })
  @IsNotEmpty()
  @IsString()
  labContactEmail: string;

  @ApiPropertyOptional({ description: 'Expected completion date' })
  @IsOptional()
  @IsDateString()
  expectedCompletionDate?: string;
}

export class RemediateSampleDto {
  @ApiProperty({ description: 'Sample ID' })
  @IsNotEmpty()
  @IsUUID()
  sampleId: string;

  @ApiProperty({ enum: RemediationType, description: 'Type of remediation' })
  @IsNotEmpty()
  @IsEnum(RemediationType)
  remediationType: RemediationType;

  @ApiProperty({ description: 'Reason for remediation' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Remediation notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SampleFilterDto {
  @ApiPropertyOptional({ enum: SampleType })
  @IsOptional()
  @IsEnum(SampleType)
  sampleType?: SampleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
