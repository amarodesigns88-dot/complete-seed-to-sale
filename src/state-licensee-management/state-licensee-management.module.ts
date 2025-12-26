import { Module } from '@nestjs/common';
import { StateLicenseeManagementController } from './state-licensee-management.controller';
import { StateLicenseeManagementService } from './state-licensee-management.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StateLicenseeManagementController],
  providers: [StateLicenseeManagementService],
  exports: [StateLicenseeManagementService],
})
export class StateLicenseeManagementModule {}
