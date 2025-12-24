import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SalesService', () => {
  let service: SalesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    sale: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    saleItem: {
      create: jest.fn(),
    },
    inventoryItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    refund: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSale', () => {
    const locationId = 'test-location-id';
    const userId = 'test-user-id';
    const createSaleDto = {
      customerId: 'test-customer-id',
      items: [
        {
          inventoryItemId: 'inventory-1',
          quantity: 2,
          price: 50,
          discountAmount: 0,
        },
      ],
    };

    it('should create a sale successfully', async () => {
      const mockInventoryItem = {
        id: 'inventory-1',
        productName: 'Test Product',
        quantity: 10,
        status: 'active',
        deletedAt: null,
      };

      const mockSale = {
        id: 'sale-1',
        totalAmount: 100,
        status: 'completed',
        saleItems: [],
        customer: null,
      };

      mockPrismaService.inventoryItem.findMany.mockResolvedValue([mockInventoryItem]);
      mockPrismaService.sale.create.mockResolvedValue(mockSale);
      mockPrismaService.sale.findUnique.mockResolvedValue(mockSale);
      mockPrismaService.saleItem.create.mockResolvedValue({});
      mockPrismaService.inventoryItem.update.mockResolvedValue({});

      const result = await service.createSale(locationId, createSaleDto, userId);

      expect(result).toBeDefined();
      expect(mockPrismaService.inventoryItem.findMany).toHaveBeenCalled();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if inventory item not found', async () => {
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([]);

      await expect(
        service.createSale(locationId, createSaleDto, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient quantity', async () => {
      const mockInventoryItem = {
        id: 'inventory-1',
        productName: 'Test Product',
        quantity: 1, // Less than requested
        status: 'active',
        deletedAt: null,
      };

      mockPrismaService.inventoryItem.findMany.mockResolvedValue([mockInventoryItem]);

      await expect(
        service.createSale(locationId, createSaleDto, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSales', () => {
    it('should return list of sales', async () => {
      const mockSales = [
        {
          id: 'sale-1',
          totalAmount: 100,
          status: 'completed',
          saleItems: [],
          customer: null,
          user: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.sale.findMany.mockResolvedValue(mockSales);

      const result = await service.getSales('test-location-id');

      expect(result).toEqual(mockSales);
      expect(mockPrismaService.sale.findMany).toHaveBeenCalled();
    });
  });

  describe('voidSale', () => {
    it('should void a sale and restore inventory', async () => {
      const mockSale = {
        id: 'sale-1',
        voidedAt: null,
        saleItems: [
          {
            inventoryItemId: 'inventory-1',
            quantity: 2,
          },
        ],
      };

      mockPrismaService.sale.findUnique.mockResolvedValue(mockSale);
      mockPrismaService.sale.update.mockResolvedValue({
        ...mockSale,
        status: 'voided',
        voidedAt: new Date(),
      });
      mockPrismaService.inventoryItem.update.mockResolvedValue({});

      const result = await service.voidSale('sale-1', 'Test reason', 'user-1');

      expect(result).toBeDefined();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if sale already voided', async () => {
      const mockSale = {
        id: 'sale-1',
        voidedAt: new Date(),
        saleItems: [],
      };

      mockPrismaService.sale.findUnique.mockResolvedValue(mockSale);

      await expect(
        service.voidSale('sale-1', 'Test reason', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const createCustomerDto = {
        name: 'John Doe',
        patientCardNumber: '12345',
        contactInfo: { email: 'john@example.com' },
      };

      const mockCustomer = {
        id: 'customer-1',
        ...createCustomerDto,
      };

      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.createCustomer(createCustomerDto);

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: {
          name: createCustomerDto.name,
          patientCardNumber: createCustomerDto.patientCardNumber,
          contactInfo: createCustomerDto.contactInfo,
        },
      });
    });
  });

  describe('getAvailableInventory', () => {
    it('should return available inventory items', async () => {
      const mockInventory = [
        {
          id: 'inventory-1',
          productName: 'Product 1',
          quantity: 10,
          status: 'active',
          deletedAt: null,
        },
      ];

      mockPrismaService.inventoryItem.findMany.mockResolvedValue(mockInventory);

      const result = await service.getAvailableInventory('test-location-id');

      expect(result).toEqual(mockInventory);
      expect(mockPrismaService.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
            deletedAt: null,
            quantity: { gt: 0 },
          }),
        }),
      );
    });
  });
});
