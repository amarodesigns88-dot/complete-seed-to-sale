import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { LicenseeModule } from './licensee/licensee.module';
import { UserModule } from './user/user.module';
import { CultivationModule } from './cultivation/cultivation.module';
import { SalesModule } from './sales/sales.module';
// import { InventoryModule } from './inventory/inventory.module';
// TODO: Fix schema mismatches in these modules before re-enabling
// import { ConversionModule } from './conversion/conversion.module';
// import { TransferModule } from './transfer/transfer.module';
// import { TestingModule } from './testing/testing.module';
// import { LabModule } from './lab/lab.module';
import { StateUserManagementModule } from './state-user-management/state-user-management.module';
// import { StateDashboardModule } from './state-dashboard/state-dashboard.module';
import { StateLicenseeManagementModule } from './state-licensee-management/state-licensee-management.module';
// import { StateReportingModule } from './state-reporting/state-reporting.module';
import { SystemAdminModule } from './system-admin/system-admin.module';
// import { LicenseeReportingModule } from './licensee-reporting/licensee-reporting.module';

@Module({
  imports: [
    AuthModule,
    LicenseeModule,
    UserModule,
    CultivationModule,
    SalesModule,
    // InventoryModule, // TODO: Fix quantity->quantity, usableWeight->usableWeight, room relation, AuditLog fields, strainId
    // ConversionModule, // TODO: Fix prisma.inventory -> prisma.inventoryItem and field mismatches
    // TransferModule, // TODO: Fix AuditLog entity->entityType
    // TestingModule, // TODO: Fix prisma.inventory -> prisma.inventoryItem
    // LabModule, // TODO: Fix Sample relations and TestResult fields
    StateUserManagementModule,
    // StateDashboardModule, // TODO: Fix prisma.inventory -> prisma.inventoryItem
    StateLicenseeManagementModule,
    // StateReportingModule, // TODO: Fix prisma.inventory -> prisma.inventoryItem
    SystemAdminModule,
    // LicenseeReportingModule, // TODO: Fix prisma.inventory -> prisma.inventoryItem
  ],
  providers: [PrismaService],
})
export class AppModule {}