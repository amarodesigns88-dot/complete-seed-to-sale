import { Module } from '@nestjs/common';
import { LicenseeController } from './licensee.controller';
import { LicenseeService } from './licensee.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LicenseeController],
  providers: [LicenseeService],
  exports: [LicenseeService],
})
export class LicenseeModule {}