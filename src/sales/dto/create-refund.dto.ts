import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({ description: 'Sale UUID to refund' })
  @IsString()
  saleId: string;

  @ApiProperty({ description: 'Refund amount' })
  @IsNumber()
  @Min(0.01)
  refundAmount: number;

  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsString()
  @IsOptional()
  reason?: string;
}
