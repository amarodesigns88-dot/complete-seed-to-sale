import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryType } from '@prisma/client';

@Injectable()
export class InventoryTypeService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<InventoryType[]> {
    return this.prisma.inventoryType.findMany({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<InventoryType> {
    const inventoryType = await this.prisma.inventoryType.findUnique({ where: { id } });
    if (!inventoryType) {
      throw new NotFoundException(`InventoryType with id ${id} not found`);
    }
    return inventoryType;
  }

  async create(data: { name: string; description?: string; unit: string; isSource: boolean }): Promise<InventoryType> {
    return this.prisma.inventoryType.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; description?: string; unit: string; isSource: boolean; isActive: boolean }>): Promise<InventoryType> {
    await this.findOne(id); // ensure exists
    return this.prisma.inventoryType.update({ where: { id }, data });
  }

  async deactivate(id: string): Promise<InventoryType> {
    await this.findOne(id);
    return this.prisma.inventoryType.update({ where: { id }, data: { isActive: false } });
  }
}