import { Module } from '@nestjs/common';
import { StateUserManagementController } from './state-user-management.controller';
import { StateUserManagementService } from './state-user-management.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StateUserManagementController],
  providers: [StateUserManagementService],
  exports: [StateUserManagementService],
})
export class StateUserManagementModule {}
