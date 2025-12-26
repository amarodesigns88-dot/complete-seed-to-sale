import { Module } from '@nestjs/common';
import { LicenseeReportingController } from './licensee-reporting.controller';
import { LicenseeReportingService } from './licensee-reporting.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LicenseeReportingController],
  providers: [LicenseeReportingService],
  exports: [LicenseeReportingService],
})
export class LicenseeReportingModule {}
