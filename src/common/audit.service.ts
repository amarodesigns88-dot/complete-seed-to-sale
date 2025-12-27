// src/common/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(params: {
    userId: string | null;
    module: string;
    entityType: string;
    entityId: string;
    actionType: string;
    details: any;
  }) {
    await this.prisma.auditLog.create({
      data: {
        module: "Common",
        id: uuidv4(),
        userId: params.userId,
        module: params.module,
        entityType: params.entityType,
        entityId: params.entityId,
        actionType: params.actionType,
        details: params.details,
        createdAt: new Date(),
      },
    });
  }
}