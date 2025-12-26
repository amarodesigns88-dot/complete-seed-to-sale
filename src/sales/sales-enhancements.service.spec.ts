import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SalesService - Sprints 3-4 Enhancements', () => {
  let service: SalesService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      sale: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
      },
      loyaltyProgram: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      customerLoyalty: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEnhancedSale', () => {
    it('should create a regular sale', async () => {
      const mockSale = {
        id: 'sale-123',
        locationId: 'loc-123',
        saleType: 'regular',
        totalAmount: 100,
        subtotal: 90,
        taxAmount: 10,
      };

      prisma.sale.create.mockResolvedValue(mockSale);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.createEnhancedSale('loc-123', {
        saleType: 'regular',
        customerId: 'cust-123',
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            unitPrice: 45,
          },
        ],
      });

      expect(result.saleType).toBe('regular');
      expect(prisma.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            saleType: 'regular',
          }),
        }),
      );
    });

    it('should create a pickup sale with scheduled time', async () => {
      const pickupTime = new Date('2025-12-27T10:00:00Z');
      const mockSale = {
        id: 'sale-123',
        locationId: 'loc-123',
        saleType: 'pickup',
        totalAmount: 100,
      };

      prisma.sale.create.mockResolvedValue(mockSale);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.createEnhancedSale('loc-123', {
        saleType: 'pickup',
        customerId: 'cust-123',
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 90 }],
        pickupInfo: {
          scheduledPickupTime: pickupTime,
          pickupLocation: 'Store Front',
        },
      });

      expect(result.saleType).toBe('pickup');
      expect(prisma.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pickupInfo: expect.any(Object),
          }),
        }),
      );
    });

    it('should create a delivery sale with address and fee', async () => {
      const mockSale = {
        id: 'sale-123',
        locationId: 'loc-123',
        saleType: 'delivery',
        totalAmount: 110,
        deliveryFee: 10,
      };

      prisma.sale.create.mockResolvedValue(mockSale);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.createEnhancedSale('loc-123', {
        saleType: 'delivery',
        customerId: 'cust-123',
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 90 }],
        deliveryInfo: {
          deliveryAddress: '123 Main St',
          deliveryCity: 'Springfield',
          deliveryState: 'IL',
          deliveryZip: '62701',
          deliveryFee: 10,
        },
      });

      expect(result.saleType).toBe('delivery');
      expect(result.deliveryFee).toBe(10);
    });

    it('should apply loyalty points redemption', async () => {
      const mockSale = {
        id: 'sale-123',
        totalAmount: 80,
      };
      const mockCustomerLoyalty = {
        customerId: 'cust-123',
        points: 500,
      };

      prisma.customerLoyalty.findUnique.mockResolvedValue(mockCustomerLoyalty);
      prisma.sale.create.mockResolvedValue(mockSale);
      prisma.customerLoyalty.upsert.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.createEnhancedSale('loc-123', {
        saleType: 'regular',
        customerId: 'cust-123',
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 90 }],
        loyaltyRedemption: {
          pointsToRedeem: 200,
          discountAmount: 10,
        },
      });

      expect(result.totalAmount).toBe(80);
      expect(prisma.customerLoyalty.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            points: { decrement: 200 },
          }),
        }),
      );
    });

    it('should throw BadRequestException if pickup info missing for pickup sale', async () => {
      await expect(
        service.createEnhancedSale('loc-123', {
          saleType: 'pickup',
          customerId: 'cust-123',
          items: [{ productId: 'prod-1', quantity: 1, unitPrice: 90 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if delivery info missing for delivery sale', async () => {
      await expect(
        service.createEnhancedSale('loc-123', {
          saleType: 'delivery',
          customerId: 'cust-123',
          items: [{ productId: 'prod-1', quantity: 1, unitPrice: 90 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createLoyaltyProgram', () => {
    it('should create a new loyalty program', async () => {
      const mockProgram = {
        id: 'program-123',
        locationId: 'loc-123',
        name: 'Gold Rewards',
        pointsPerDollar: 10,
        redemptionRate: 0.01,
      };

      prisma.loyaltyProgram.create.mockResolvedValue(mockProgram);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.createLoyaltyProgram('loc-123', {
        name: 'Gold Rewards',
        pointsPerDollar: 10,
        redemptionRate: 0.01,
        description: 'Earn 10 points per dollar spent',
      });

      expect(result.name).toBe('Gold Rewards');
      expect(result.pointsPerDollar).toBe(10);
      expect(prisma.loyaltyProgram.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if redemption rate is invalid', async () => {
      await expect(
        service.createLoyaltyProgram('loc-123', {
          name: 'Invalid Program',
          pointsPerDollar: 10,
          redemptionRate: 1.5, // > 1.0
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLoyaltyPrograms', () => {
    it('should retrieve all loyalty programs for a location', async () => {
      const mockPrograms = [
        { id: 'prog-1', name: 'Silver', pointsPerDollar: 5 },
        { id: 'prog-2', name: 'Gold', pointsPerDollar: 10 },
      ];

      prisma.loyaltyProgram.findMany.mockResolvedValue(mockPrograms);

      const result = await service.getLoyaltyPrograms('loc-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Silver');
    });
  });

  describe('updateCustomerLoyalty', () => {
    it('should add loyalty points to customer', async () => {
      const mockUpdated = {
        customerId: 'cust-123',
        points: 150,
        totalPointsEarned: 150,
      };

      prisma.customerLoyalty.upsert.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.updateCustomerLoyalty('loc-123', 'cust-123', {
        pointsChange: 150,
        reason: 'Purchase reward',
      });

      expect(result.points).toBe(150);
      expect(prisma.customerLoyalty.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            points: { increment: 150 },
          }),
        }),
      );
    });

    it('should deduct loyalty points from customer', async () => {
      const mockExisting = {
        customerId: 'cust-123',
        points: 200,
      };
      const mockUpdated = {
        customerId: 'cust-123',
        points: 50,
      };

      prisma.customerLoyalty.findUnique.mockResolvedValue(mockExisting);
      prisma.customerLoyalty.upsert.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.updateCustomerLoyalty('loc-123', 'cust-123', {
        pointsChange: -150,
        reason: 'Redemption',
      });

      expect(result.points).toBe(50);
    });

    it('should throw BadRequestException if deduction exceeds available points', async () => {
      const mockExisting = {
        customerId: 'cust-123',
        points: 100,
      };

      prisma.customerLoyalty.findUnique.mockResolvedValue(mockExisting);

      await expect(
        service.updateCustomerLoyalty('loc-123', 'cust-123', {
          pointsChange: -200,
          reason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCustomerLoyalty', () => {
    it('should retrieve customer loyalty information', async () => {
      const mockLoyalty = {
        customerId: 'cust-123',
        points: 500,
        totalPointsEarned: 1200,
        totalPointsRedeemed: 700,
      };

      prisma.customerLoyalty.findUnique.mockResolvedValue(mockLoyalty);

      const result = await service.getCustomerLoyalty('loc-123', 'cust-123');

      expect(result.points).toBe(500);
      expect(result.totalPointsEarned).toBe(1200);
    });

    it('should return null if customer has no loyalty record', async () => {
      prisma.customerLoyalty.findUnique.mockResolvedValue(null);

      const result = await service.getCustomerLoyalty('loc-123', 'cust-123');

      expect(result).toBeNull();
    });
  });

  describe('customizeProductPricing', () => {
    it('should apply percentage discount to product', async () => {
      const mockProduct = {
        id: 'prod-123',
        basePrice: 100,
        customPrice: null,
      };
      const mockUpdated = {
        ...mockProduct,
        customPrice: 80,
        discountPercentage: 20,
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.customizeProductPricing('loc-123', {
        productId: 'prod-123',
        discountType: 'percentage',
        discountValue: 20,
        reason: 'Promotional discount',
      });

      expect(result.customPrice).toBe(80);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discountPercentage: 20,
          }),
        }),
      );
    });

    it('should apply fixed amount discount to product', async () => {
      const mockProduct = {
        id: 'prod-123',
        basePrice: 100,
      };
      const mockUpdated = {
        ...mockProduct,
        customPrice: 75,
        discountAmount: 25,
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.customizeProductPricing('loc-123', {
        productId: 'prod-123',
        discountType: 'fixed',
        discountValue: 25,
        reason: 'Clearance sale',
      });

      expect(result.customPrice).toBe(75);
    });

    it('should set custom price override', async () => {
      const mockProduct = {
        id: 'prod-123',
        basePrice: 100,
      };
      const mockUpdated = {
        ...mockProduct,
        customPrice: 85,
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.customizeProductPricing('loc-123', {
        productId: 'prod-123',
        customPrice: 85,
        reason: 'Special pricing',
      });

      expect(result.customPrice).toBe(85);
    });

    it('should throw BadRequestException if discount exceeds 100%', async () => {
      const mockProduct = {
        id: 'prod-123',
        basePrice: 100,
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.customizeProductPricing('loc-123', {
          productId: 'prod-123',
          discountType: 'percentage',
          discountValue: 150,
          reason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.customizeProductPricing('loc-123', {
          productId: 'invalid-prod',
          discountType: 'percentage',
          discountValue: 10,
          reason: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('applyBulkDiscount', () => {
    it('should apply discount to multiple products', async () => {
      const mockProducts = [
        { id: 'prod-1', basePrice: 100 },
        { id: 'prod-2', basePrice: 150 },
      ];

      prisma.product.findMany = jest.fn().mockResolvedValue(mockProducts);
      prisma.product.update.mockResolvedValue({ customPrice: 80 });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.applyBulkDiscount('loc-123', {
        productIds: ['prod-1', 'prod-2'],
        discountType: 'percentage',
        discountValue: 20,
        reason: 'Bulk discount',
      });

      expect(result.updatedCount).toBe(2);
      expect(prisma.product.update).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if no products found', async () => {
      prisma.product.findMany = jest.fn().mockResolvedValue([]);

      await expect(
        service.applyBulkDiscount('loc-123', {
          productIds: ['invalid-1', 'invalid-2'],
          discountType: 'percentage',
          discountValue: 10,
          reason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
