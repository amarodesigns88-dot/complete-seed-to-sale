import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransferDto,
  ReceiveTransferDto,
  RegisterDriverDto,
  RegisterVehicleDto,
  TransferFilterDto,
  TransferStatus,
} from './dto/transfer.dto';

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  async createTransfer(locationId: string, dto: CreateTransferDto) {
    // Validate source location exists
    const sourceLocation = await this.prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!sourceLocation) {
      throw new NotFoundException('Source location not found');
    }

    // Validate destination location exists
    const destinationLocation = await this.prisma.location.findUnique({
      where: { id: dto.receiverLocationId },
    });

    if (!destinationLocation) {
      throw new NotFoundException('Destination location not found');
    }

    // Validate driver exists
    const driver = await this.prisma.driver.findUnique({
      where: { id: dto.driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Validate vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Validate all inventory items exist and belong to source location
    for (const item of dto.items) {
      const inventoryItem = await this.prisma.inventoryItem.findUnique({
        where: { id: item.inventoryItemId },
      });

      if (!inventoryItem) {
        throw new NotFoundException(
          `Inventory item ${item.inventoryItemId} not found`,
        );
      }

      if (inventoryItem.locationId !== locationId) {
        throw new BadRequestException(
          `Inventory item ${item.inventoryItemId} does not belong to source location`,
        );
      }

      if (inventoryItem.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient quantity for item ${item.inventoryItemId}`,
        );
      }
    }

    // Generate manifest number
    const manifestNumber = `TRF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create transfer with items
    const transfer = await this.prisma.transfer.create({
      data: {
        manifestNumber,
        senderLocationId: locationId,
        receiverLocationId: dto.receiverLocationId,
        driverId: dto.driverId,
        vehicleId: dto.vehicleId,
        status: TransferStatus.PENDING,
        estimatedArrival: new Date(dto.estimatedArrival),
        notes: dto.notes,
        transferItems: {
          create: dto.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        transferItems: {
          include: {
            inventoryItem: true,
          },
        },
        driver: true,
        vehicle: true,
        sourceLocation: true,
        destinationLocation: true,
      },
    });

    // Update inventory items to reserve quantities
    for (const item of dto.items) {
      await this.prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Transfer',
        entityId: transfer.id,
        actionType: 'CREATE',
        userId: 'system', // Should be from auth context
        changes: JSON.stringify({
          manifestNumber: transfer.manifestNumber,
          receiverLocationId: dto.receiverLocationId,
          itemCount: dto.items.length,
        }),
      },
    });

    return transfer;
  }

  async getTransfers(locationId: string, filters: TransferFilterDto) {
    const { status, receiverLocationId, page = 1, limit = 20 } = filters;

    const where: any = {
      OR: [{ senderLocationId: locationId }, { receiverLocationId: locationId }],
    };

    if (status) {
      where.status = status;
    }

    if (receiverLocationId) {
      where.receiverLocationId = receiverLocationId;
    }

    const [transfers, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        include: {
          transferItems: {
            include: {
              inventoryItem: true,
            },
          },
          driver: true,
          vehicle: true,
          sourceLocation: true,
          destinationLocation: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return {
      transfers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingTransfers(locationId: string) {
    const transfers = await this.prisma.transfer.findMany({
      where: {
        receiverLocationId: locationId,
        status: TransferStatus.PENDING,
      },
      include: {
        transferItems: {
          include: {
            inventoryItem: true,
          },
        },
        driver: true,
        vehicle: true,
        sourceLocation: true,
      },
      orderBy: { estimatedArrival: 'asc' },
    });

    return transfers;
  }

  async getOverdueTransfers(locationId: string) {
    const now = new Date();

    const transfers = await this.prisma.transfer.findMany({
      where: {
        receiverLocationId: locationId,
        status: {
          in: [TransferStatus.PENDING, TransferStatus.IN_TRANSIT],
        },
        estimatedArrival: {
          lt: now,
        },
      },
      include: {
        transferItems: {
          include: {
            inventoryItem: true,
          },
        },
        driver: true,
        vehicle: true,
        sourceLocation: true,
      },
      orderBy: { estimatedArrival: 'asc' },
    });

    return transfers;
  }

  async getTransfer(locationId: string, transferId: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        transferItems: {
          include: {
            inventoryItem: true,
          },
        },
        driver: true,
        vehicle: true,
        sourceLocation: true,
        destinationLocation: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    // Verify location has access to this transfer
    if (
      transfer.senderLocationId !== locationId &&
      transfer.receiverLocationId !== locationId
    ) {
      throw new NotFoundException('Transfer not found');
    }

    return transfer;
  }

  async receiveTransfer(
    locationId: string,
    transferId: string,
    dto: ReceiveTransferDto,
  ) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        transferItems: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.receiverLocationId !== locationId) {
      throw new BadRequestException(
        'Transfer can only be received by destination location',
      );
    }

    if (transfer.status !== TransferStatus.PENDING && transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException(
        `Transfer cannot be received in ${transfer.status} status`,
      );
    }

    if (dto.status === 'RECEIVED') {
      // Create inventory items at destination location
      for (const item of transfer.transferItems) {
        await this.prisma.inventoryItem.create({
          data: {
            locationId: locationId,
            inventoryTypeId: item.inventoryItem.inventoryTypeId,
            strainId: item.inventoryItem.strainId,
            quantity: item.quantity,
            roomId: item.inventoryItem.roomId, // Should be mapped to destination room
            barcode: `${item.inventoryItem.barcode}-TRF-${Date.now()}`,
          },
        });
      }
    } else if (dto.status === 'REJECTED') {
      // Return items to source location inventory
      for (const item of transfer.transferItems) {
        await this.prisma.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // Update transfer status
    const updatedTransfer = await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        status: dto.status === 'RECEIVED' ? TransferStatus.RECEIVED : TransferStatus.REJECTED,
        notes: dto.notes,
        receivedAt: dto.status === 'RECEIVED' ? new Date() : null,
      },
      include: {
        transferItems: {
          include: {
            inventoryItem: true,
          },
        },
        driver: true,
        vehicle: true,
        sourceLocation: true,
        destinationLocation: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Transfer',
        entityId: transferId,
        action: dto.status === 'RECEIVED' ? 'RECEIVE' : 'REJECT',
        userId: 'system', // Should be from auth context
        changes: JSON.stringify({
          status: dto.status,
          notes: dto.notes,
          rejectionReason: dto.rejectionReason,
        }),
      },
    });

    return updatedTransfer;
  }

  async registerDriver(locationId: string, dto: RegisterDriverDto) {
    // Validate location exists
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check if driver with same license number already exists
    const existingDriver = await this.prisma.driver.findFirst({
      where: {
        licenseNumber: dto.licenseNumber,
      },
    });

    if (existingDriver) {
      throw new BadRequestException(
        'Driver with this license number already exists',
      );
    }

    const driver = await this.prisma.driver.create({
      data: {
        ...dto,
        locationId,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Driver',
        entityId: driver.id,
        actionType: 'CREATE',
        userId: 'system', // Should be from auth context
        changes: JSON.stringify({
          name: driver.name,
          licenseNumber: driver.licenseNumber,
        }),
      },
    });

    return driver;
  }

  async getDrivers(locationId: string) {
    const drivers = await this.prisma.driver.findMany({
      where: {
        locationId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return drivers;
  }

  async registerVehicle(locationId: string, dto: RegisterVehicleDto) {
    // Validate location exists
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check if vehicle with same license plate already exists
    const existingVehicle = await this.prisma.vehicle.findFirst({
      where: {
        licensePlate: dto.licensePlate,
      },
    });

    if (existingVehicle) {
      throw new BadRequestException(
        'Vehicle with this license plate already exists',
      );
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...dto,
        locationId,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Vehicle',
        entityId: vehicle.id,
        actionType: 'CREATE',
        userId: 'system', // Should be from auth context
        changes: JSON.stringify({
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
        }),
      },
    });

    return vehicle;
  }

  async getVehicles(locationId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        locationId,
        deletedAt: null,
      },
      orderBy: { make: 'asc' },
    });

    return vehicles;
  }
}
