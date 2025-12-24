import { Module } from '@nestjs/common';
import { LicenseeController } from './licensee.controller';

@Module({
  controllers: [LicenseeController],
})
export class LicenseeModule {}