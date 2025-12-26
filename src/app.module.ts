import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { LicenseeModule } from './licensee/licensee.module';
import { UserModule } from './user/user.module';
import { CultivationModule } from './cultivation/cultivation.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { ConversionModule } from './conversion/conversion.module';
import { TransferModule } from './transfer/transfer.module';

@Module({
  imports: [
    AuthModule,
    LicenseeModule,
    UserModule,
    CultivationModule,
    SalesModule,
    InventoryModule,
    ConversionModule,
    TransferModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}