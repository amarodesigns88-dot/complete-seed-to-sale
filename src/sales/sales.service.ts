import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, SaleItemDto } from './dto/create-sale.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new sale transaction
   */
  async createSale(locationId: string, dto: CreateSaleDto, userId?: string) {
    // Validate all inventory items exist and have sufficient quantity
    // Fetch all items in a single query for better performance
    const inventoryItemIds = dto.items.map(item => item.inventoryItemId);
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        id: { in: inventoryItemIds },
        locationId,
        status: 'active',
        deletedAt: null,
      },
    });

    // Create a map for quick lookup
    const inventoryMap = new Map(inventoryItems.map(item => [item.id, item]));

    // Validate each item
    for (const item of dto.items) {
      const inventoryItem = inventoryMap.get(item.inventoryItemId);

      if (!inventoryItem) {
        throw new NotFoundException(`Inventory item ${item.inventoryItemId} not found`);
      }

      if (inventoryItem.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient quantity for item ${inventoryItem.productName}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`,
        );
      }
    }

    // Calculate total amount
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity - (item.discountAmount || 0),
      0,
    );

    // Create sale and sale items in a transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          customerId: dto.customerId,
          userId,
          totalAmount,
          status: 'completed',
        },
      });

      // Create sale items and update inventory quantities
      for (const item of dto.items) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            price: item.price,
            discountAmount: item.discountAmount || 0,
          },
        });

        // Decrement inventory quantity
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return tx.sale.findUnique({
        where: { id: newSale.id },
        include: {
          saleItems: {
            include: {
              inventoryItem: true,
            },
          },
          customer: true,
        },
      });
    });

    return sale;
  }

  /**
   * Get sales for a location
   */
  async getSales(locationId: string) {
    return this.prisma.sale.findMany({
      where: {
        saleItems: {
          some: {
            inventoryItem: {
              locationId,
            },
          },
        },
      },
      include: {
        saleItems: {
          include: {
            inventoryItem: true,
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single sale by ID
   */
  async getSaleById(saleId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        saleItems: {
          include: {
            inventoryItem: true,
          },
        },
        customer: true,
        refunds: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${saleId} not found`);
    }

    return sale;
  }

  /**
   * Void a sale (mark as voided, restore inventory)
   */
  async voidSale(saleId: string, voidReason: string, userId?: string) {
    const sale = await this.getSaleById(saleId);

    if (sale.voidedAt) {
      throw new BadRequestException('Sale is already voided');
    }

    // Void sale and restore inventory quantities in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Restore inventory quantities
      for (const item of sale.saleItems) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      // Mark sale as voided
      return tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'voided',
          voidedAt: new Date(),
          voidReason,
        },
        include: {
          saleItems: {
            include: {
              inventoryItem: true,
            },
          },
          customer: true,
        },
      });
    });
  }

  /**
   * Create a refund for a sale
   */
  async createRefund(dto: CreateRefundDto, userId?: string) {
    const sale = await this.getSaleById(dto.saleId);

    if (sale.voidedAt) {
      throw new BadRequestException('Cannot refund a voided sale');
    }

    // Calculate total refunded amount
    const totalRefunded = sale.refunds.reduce((sum, r) => sum + r.refundAmount, 0);

    if (totalRefunded + dto.refundAmount > sale.totalAmount) {
      throw new BadRequestException('Refund amount exceeds sale total');
    }

    return this.prisma.refund.create({
      data: {
        saleId: dto.saleId,
        userId,
        refundAmount: dto.refundAmount,
        reason: dto.reason,
      },
      include: {
        sale: true,
      },
    });
  }

  /**
   * Customer Management
   */
  async createCustomer(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        patientCardNumber: dto.patientCardNumber,
        contactInfo: dto.contactInfo || {},
      },
    });
  }

  async getCustomers() {
    return this.prisma.customer.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getCustomerById(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    return customer;
  }

  /**
   * Get available inventory for sale at a location
   */
  async getAvailableInventory(locationId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        locationId,
        status: 'active',
        deletedAt: null,
        quantity: {
          gt: 0,
        },
      },
      include: {
        inventoryType: true,
      },
      orderBy: {
        productName: 'asc',
      },
    });
  }
}
