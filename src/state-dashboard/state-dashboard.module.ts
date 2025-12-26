import { Module } from '@nestjs/common';
import { StateDashboardController } from './state-dashboard.controller';
import { StateDashboardService } from './state-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StateDashboardController],
  providers: [StateDashboardService],
  exports: [StateDashboardService],
})
export class StateDashboardModule {}
