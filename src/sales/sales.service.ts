import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, SaleItemDto } from './dto/create-sale.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  CreateEnhancedSaleDto,
  SaleType,
  EnhancedSaleItemDto,
} from './dto/create-sale-enhanced.dto';
import { CreateLoyaltyProgramDto, UpdateCustomerLoyaltyDto } from './dto/create-loyalty-program.dto';
import {
  CustomizeProductDto,
  BulkDiscountDto,
  DiscountType,
} from './dto/customize-product.dto';

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

  // ===== ENHANCED SALES/POS MODULE =====

  /**
   * Create an enhanced sale with sale type support (Regular, Pickup, Delivery)
   */
  async createEnhancedSale(locationId: string, dto: CreateEnhancedSaleDto, userId?: string) {
    // Validate sale type specific requirements
    if (dto.saleType === SaleType.DELIVERY && !dto.deliveryInfo) {
      throw new BadRequestException('Delivery information is required for delivery sales');
    }

    if (dto.saleType === SaleType.PICKUP && !dto.pickupInfo) {
      throw new BadRequestException('Pickup information is required for pickup sales');
    }

    // Validate inventory items
    const inventoryItemIds = dto.items.map(item => item.inventoryItemId);
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        id: { in: inventoryItemIds },
        locationId,
        status: 'active',
        deletedAt: null,
      },
    });

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

    // Calculate amounts with loyalty and discounts
    let subtotal = 0;
    const itemsWithPricing: any[] = [];

    for (const item of dto.items) {
      const finalPrice = item.customPrice ?? item.price;
      let discountAmount = item.discountAmount || 0;

      // Apply percentage discount if specified
      if (item.discountPercentage) {
        discountAmount += (finalPrice * item.quantity * item.discountPercentage) / 100;
      }

      const itemTotal = finalPrice * item.quantity - discountAmount;
      subtotal += itemTotal;

      itemsWithPricing.push({
        ...item,
        finalPrice,
        finalDiscountAmount: discountAmount,
        itemTotal,
      });
    }

    // Apply loyalty redemption discount
    let loyaltyDiscount = 0;
    if (dto.loyaltyRedemption) {
      loyaltyDiscount = dto.loyaltyRedemption.discountAmount;
    }

    // Calculate delivery fee for delivery sales
    const deliveryFee = dto.saleType === SaleType.DELIVERY && dto.deliveryInfo?.deliveryFee
      ? dto.deliveryInfo.deliveryFee
      : 0;

    const taxAmount = dto.taxAmount || 0;
    const additionalFees = dto.additionalFees || 0;

    const totalAmount = subtotal - loyaltyDiscount + deliveryFee + taxAmount + additionalFees;

    // Create sale in a transaction
    const sale = await this.prisma.$transaction(async (tx) => {
      // Store sale metadata
      const saleMetadata: any = {
        saleType: dto.saleType,
        subtotal,
        loyaltyDiscount,
        deliveryFee,
        taxAmount,
        additionalFees,
      };

      if (dto.deliveryInfo) {
        saleMetadata.deliveryInfo = dto.deliveryInfo;
      }

      if (dto.pickupInfo) {
        saleMetadata.pickupInfo = dto.pickupInfo;
      }

      if (dto.notes) {
        saleMetadata.notes = dto.notes;
      }

      const newSale = await tx.sale.create({
        data: {
          customerId: dto.customerId,
          userId,
          totalAmount,
          status: 'completed',
          // Store metadata in notes for now (ideally would add saleMetadata JSON field)
          voidReason: JSON.stringify(saleMetadata),
        },
      });

      // Create sale items
      for (const item of itemsWithPricing) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            price: item.finalPrice,
            discountAmount: item.finalDiscountAmount,
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

      // Handle loyalty redemption
      if (dto.loyaltyRedemption && dto.customerId) {
        // Note: Would need CustomerLoyalty table - for now just log
        // In production: Deduct points from customer loyalty balance
      }

      // Handle loyalty points earning
      if (dto.earnLoyaltyPoints && dto.customerId) {
        // Note: Would need CustomerLoyalty table and LoyaltyProgram - for now just log
        // In production: Add points based on loyalty program rules
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
   * Create a loyalty program
   */
  async createLoyaltyProgram(locationId: string, dto: CreateLoyaltyProgramDto, userId?: string) {
    // Note: This would require a LoyaltyProgram table in the schema
    // For now, return a mock response showing the structure
    return {
      id: 'mock-loyalty-program-id',
      locationId,
      name: dto.name,
      description: dto.description,
      pointsPerDollar: dto.pointsPerDollar,
      dollarValuePerPoint: dto.dollarValuePerPoint,
      minimumPointsForRedemption: dto.minimumPointsForRedemption || 0,
      isActive: dto.isActive !== false,
      createdAt: new Date(),
      message: 'Loyalty program feature requires LoyaltyProgram table in schema. This is a mock response.',
    };
  }

  /**
   * Get loyalty programs for a location
   */
  async getLoyaltyPrograms(locationId: string) {
    // Note: This would query the LoyaltyProgram table
    return {
      programs: [],
      message: 'Loyalty program feature requires LoyaltyProgram table in schema.',
    };
  }

  /**
   * Update customer loyalty points
   */
  async updateCustomerLoyalty(locationId: string, dto: UpdateCustomerLoyaltyDto, userId?: string) {
    // Note: This would require a CustomerLoyalty table
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    return {
      customerId: dto.customerId,
      loyaltyProgramId: dto.loyaltyProgramId,
      pointsDelta: dto.pointsDelta,
      reason: dto.reason,
      message: 'Customer loyalty feature requires CustomerLoyalty table in schema. This is a mock response.',
    };
  }

  /**
   * Get customer loyalty information
   */
  async getCustomerLoyalty(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    // Note: Would query CustomerLoyalty table
    return {
      customerId,
      loyaltyAccounts: [],
      totalPoints: 0,
      message: 'Customer loyalty feature requires CustomerLoyalty table in schema.',
    };
  }

  /**
   * Customize product pricing
   */
  async customizeProduct(locationId: string, dto: CustomizeProductDto, userId?: string) {
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.inventoryItemId },
    });

    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item ${dto.inventoryItemId} not found`);
    }

    if (inventoryItem.locationId !== locationId) {
      throw new BadRequestException('Inventory item does not belong to this location');
    }

    let finalPrice = inventoryItem.price;
    let discountAmount = 0;

    if (dto.customPrice !== undefined) {
      finalPrice = dto.customPrice;
    }

    if (dto.discountType && dto.discountValue !== undefined) {
      if (dto.discountType === DiscountType.PERCENTAGE) {
        discountAmount = (finalPrice * dto.discountValue) / 100;
      } else {
        discountAmount = dto.discountValue;
      }
    }

    return {
      inventoryItemId: dto.inventoryItemId,
      originalPrice: inventoryItem.price,
      customPrice: dto.customPrice,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      discountAmount,
      finalPrice: finalPrice - discountAmount,
      reason: dto.reason,
      customizedAt: new Date(),
      customizedBy: userId,
    };
  }

  /**
   * Apply bulk discount to multiple products
   */
  async applyBulkDiscount(locationId: string, dto: BulkDiscountDto, userId?: string) {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        id: { in: dto.inventoryItemIds },
        locationId,
        deletedAt: null,
      },
    });

    if (inventoryItems.length !== dto.inventoryItemIds.length) {
      throw new BadRequestException('Some inventory items were not found or do not belong to this location');
    }

    const customizedItems = inventoryItems.map(item => {
      let discountAmount = 0;

      if (dto.discountType === DiscountType.PERCENTAGE) {
        discountAmount = (item.price * dto.discountValue) / 100;
      } else {
        discountAmount = dto.discountValue;
      }

      return {
        inventoryItemId: item.id,
        productName: item.productName,
        originalPrice: item.price,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        discountAmount,
        finalPrice: item.price - discountAmount,
      };
    });

    return {
      reason: dto.reason,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      itemsAffected: customizedItems.length,
      customizedItems,
      customizedAt: new Date(),
      customizedBy: userId,
    };
  }
}
