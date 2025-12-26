import { Module } from '@nestjs/common';
import { StateReportingController } from './state-reporting.controller';
import { StateReportingService } from './state-reporting.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StateReportingController],
  providers: [StateReportingService],
  exports: [StateReportingService],
})
export class StateReportingModule {}
