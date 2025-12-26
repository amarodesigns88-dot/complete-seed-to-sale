import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber, IsEnum, IsBoolean, IsObject } from 'class-validator';

export enum TestType {
  POTENCY = 'POTENCY',
  MICROBIAL = 'MICROBIAL',
  PESTICIDES = 'PESTICIDES',
  HEAVY_METALS = 'HEAVY_METALS',
  RESIDUAL_SOLVENTS = 'RESIDUAL_SOLVENTS',
  MOISTURE_CONTENT = 'MOISTURE_CONTENT',
  TERPENES = 'TERPENES',
}

export enum TestResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export class EnterResultDto {
  @ApiProperty({ description: 'Sample ID' })
  @IsNotEmpty()
  @IsUUID()
  sampleId: string;

  @ApiProperty({ enum: TestType, description: 'Type of test' })
  @IsNotEmpty()
  @IsEnum(TestType)
  testType: TestType;

  @ApiProperty({ enum: TestResult, description: 'Test result' })
  @IsNotEmpty()
  @IsEnum(TestResult)
  result: TestResult;

  @ApiProperty({ description: 'Test data (JSON object)' })
  @IsNotEmpty()
  @IsObject()
  testData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notes about the test' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateCOADto {
  @ApiProperty({ description: 'Sample ID' })
  @IsNotEmpty()
  @IsUUID()
  sampleId: string;

  @ApiProperty({ description: 'Lab certification number' })
  @IsNotEmpty()
  @IsString()
  certificationNumber: string;

  @ApiPropertyOptional({ description: 'Additional notes for COA' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TestResultFilterDto {
  @ApiPropertyOptional({ enum: TestType })
  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType;

  @ApiPropertyOptional({ enum: TestResult })
  @IsOptional()
  @IsEnum(TestResult)
  result?: TestResult;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
