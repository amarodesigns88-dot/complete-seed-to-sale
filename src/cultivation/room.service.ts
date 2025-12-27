import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
// If you have a dedicated UpdateRoomDto, import it; otherwise we use Partial<CreateRoomDto>
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomService {
  constructor(
    private readonly prisma: PrismaService,
    // Optional AuditService — register it in the module if you have one.
    @Optional() @Inject('AuditService') private readonly auditService?: any,
  ) {}

  /**
   * Create a new room for a given location.
   * - Ensures name uniqueness per location (optional rule - adjust as needed)
   * - Records an audit entry if auditService is provided
   */
  async createRoom(locationId: string, dto: CreateRoomDto, userId: string | null) {
    // Basic validation
    if (!locationId) throw new BadRequestException('locationId is required');

    // Optional: ensure location exists
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });
    if (!location) throw new NotFoundException('Location not found');

    // Optional uniqueness check: room name per location
    const existing = await this.prisma.room.findFirst({
      where: {
        locationId,
        name: dto.name,
        deletedAt: null,
      },
    });
    if (existing) throw new BadRequestException('Room name already exists for this location');

    const now = new Date();

    const room = await this.prisma.room.create({
      data: {
        id: uuidv4(),
        locationId,
        name: dto.name,
        metadata: dto.metadata ?? {},
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.logAudit({
      userId,
      module: 'cultivation',
      entityType: 'room',
      entityId: room.id,
      actionType: 'create',
      details: { dto },
    });

    return room;
  }

  /**
   * List active (non-deleted) rooms for a location
   */
  async listRooms(locationId: string) {
    return this.prisma.room.findMany({
      where: {
        locationId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single room by id and ensure it belongs to the requested location.
   */
  async getRoomById(locationId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room || room.deletedAt) throw new NotFoundException('Room not found');
    if (room.locationId !== locationId) throw new ForbiddenException('Room does not belong to the specified location');

    return room;
  }

  /**
   * Update a room's properties (name, metadata)
   */
  async updateRoom(locationId: string, roomId: string, dto: UpdateRoomDto, userId: string | null) {
  const room = await this.prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.deletedAt) throw new NotFoundException('Room not found');
  if (room.locationId !== locationId) throw new ForbiddenException('Room does not belong to the specified location');

  // Optional: if renaming, ensure uniqueness
  if (dto.name && dto.name !== room.name) {
    const exists = await this.prisma.room.findFirst({
      where: { locationId, name: dto.name, deletedAt: null, id: { not: roomId } },
    });
    if (exists) throw new BadRequestException('Room name already exists for this location');
  }

  // Build partial data object only with properties provided on dto
  const updateData: any = {
    updatedAt: new Date(),
    updatedBy: userId,
  };

  if (dto.name !== undefined) updateData.name = dto.name;
  if (dto.roomType !== undefined) updateData.roomType = dto.roomType;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.metadata !== undefined) updateData.metadata = dto.metadata; // only set when provided

  const updated = await this.prisma.room.update({
    where: { id: roomId },
    data: updateData,
  });

    await this.logAudit({
      userId,
      module: 'cultivation',
      entityType: 'room',
      entityId: roomId,
      actionType: 'update',
      details: { before: room, after: updated },
    });

    return updated;
  }

  /**
   * Soft-delete a room (set deletedAt)
   */
  async softDeleteRoom(locationId: string, roomId: string, userId: string | null) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.deletedAt) throw new NotFoundException('Room not found');
    if (room.locationId !== locationId) throw new ForbiddenException('Room does not belong to the specified location');

    // Optional: check for dependent entities (plants) before deleting
    const dependentPlant = await this.prisma.plant.findFirst({
      where: { roomId, deletedAt: null },
      select: { id: true },
    });
    if (dependentPlant) {
      throw new BadRequestException('Cannot delete room with active plants. Move or remove plants first.');
    }

    const deleted = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date(),
      },
    });

    await this.logAudit({
      userId,
      module: 'cultivation',
      entityType: 'room',
      entityId: roomId,
      actionType: 'soft_delete',
      details: { before: room, after: deleted },
    });

    return deleted;
  }

  /**
   * Helper: log audit entries if auditService exists, otherwise no-op
   */
  private async logAudit(entry: {
    userId: string | null;
    module: string;
    entityType: string;
    entityId: string;
    actionType: string;
    details: any;
  }) {
    if (!this.auditService) {
      // If you prefer, write to a dedicated audit table directly using Prisma:
      try {
        await this.prisma.auditLog.create({
          data: {
        module: "Cultivation",
            id: uuidv4(),
            userId: entry.userId,
            module: entry.module,
            entityType: entry.entityType,
            entityId: entry.entityId,
            actionType: entry.actionType,
            details: entry.details ?? {},
            createdAt: new Date(),
          },
        });
      } catch (e) {
        // If auditLog table isn't available yet, avoid crashing service; optionally log.
        // console.warn('Audit log write failed', e);
      }
      return;
    }

    try {
      await this.auditService.create({
        userId: entry.userId,
        module: entry.module,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actionType: entry.actionType,
        details: entry.details,
      });
    } catch (err) {
      // Keep service resilient if audit fails
      // console.warn('auditService.create failed', err);
    }
  }
}
