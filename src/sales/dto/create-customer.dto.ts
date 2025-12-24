import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Patient card number (if medical)' })
  @IsString()
  @IsOptional()
  patientCardNumber?: string;

  @ApiPropertyOptional({ description: 'Contact information (email, phone, etc.)' })
  @IsObject()
  @IsOptional()
  contactInfo?: Record<string, any>;
}
