import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { EventBusService } from '../../../core/events/event-bus.service';
import type {
  CreateUomDto,
  ListUomDto,
  UpdateUomDto,
} from './dto/uom.dto';
import { UomRepository } from './uom.repository';

@Injectable()
export class UomService {
  constructor(
    private readonly repository: UomRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async findAll(query: ListUomDto) {
    const hasPagination =
      query.page !== undefined || query.limit !== undefined;

    if (!hasPagination) {
      return this.repository.findMany(query);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const [data, total] = await Promise.all([
      this.repository.findMany(query),
      this.repository.count(query),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const unit = await this.repository.findById(id);

    if (!unit) {
      throw new NotFoundException('Unit of measure not found');
    }

    return unit;
  }

  async create(dto: CreateUomDto) {
    await this.validateConversion(dto);

    const unit = await this.repository.create(this.toCreateInput(dto));

    await this.emitChanged('master-data.uom.created', unit.id, {
      code: unit.code,
      name: unit.name,
      category: unit.category,
    });

    return unit;
  }

  async update(id: string, dto: UpdateUomDto) {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException('Unit of measure not found');
    }

    await this.validateConversion(
      {
        ...dto,
        category: (dto.category ??
          existing.category) as UpdateUomDto['category'],
      },
      id,
    );

    const unit = await this.repository.update(id, this.toUpdateInput(dto));

    await this.emitChanged('master-data.uom.updated', unit.id, {
      code: unit.code,
      name: unit.name,
      category: unit.category,
      active: unit.active,
    });

    return unit;
  }

  async deactivate(id: string) {
    return this.update(id, {
      active: false,
    });
  }

  private async validateConversion(
    dto: CreateUomDto | UpdateUomDto,
    currentId?: string,
  ) {
    if (!dto.baseUnitId && dto.conversionFactor !== undefined) {
      throw new BadRequestException(
        'A conversion factor requires a base unit.',
      );
    }

    if (!dto.baseUnitId) {
      return;
    }

    if (dto.baseUnitId === currentId) {
      throw new BadRequestException('A unit cannot convert to itself.');
    }

    const baseUnit = await this.repository.findById(dto.baseUnitId);

    if (!baseUnit) {
      throw new NotFoundException('Base unit not found');
    }

    if (dto.category && baseUnit.category !== dto.category) {
      throw new BadRequestException(
        'Base unit must use the same category.',
      );
    }

    if (!baseUnit.active) {
      throw new BadRequestException('Base unit is inactive.');
    }
  }

  private toCreateInput(dto: CreateUomDto): Prisma.MasterUnitCreateInput {
    return {
      code: dto.code,
      name: dto.name,
      symbol: dto.symbol,
      category: dto.category,
      precision: dto.precision,
      active: dto.active,
      conversionFactor: dto.conversionFactor,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy ?? dto.createdBy,
      baseUnit: dto.baseUnitId
        ? {
            connect: {
              id: dto.baseUnitId,
            },
          }
        : undefined,
    };
  }

  private toUpdateInput(dto: UpdateUomDto): Prisma.MasterUnitUpdateInput {
    return {
      code: dto.code,
      name: dto.name,
      symbol: dto.symbol,
      category: dto.category,
      precision: dto.precision,
      active: dto.active,
      conversionFactor: dto.conversionFactor,
      updatedBy: dto.updatedBy,
      baseUnit:
        dto.baseUnitId === undefined
          ? undefined
          : dto.baseUnitId
            ? {
                connect: {
                  id: dto.baseUnitId,
                },
              }
            : {
                disconnect: true,
              },
    };
  }

  private async emitChanged(
    eventName: string,
    entityId: string,
    metadata: Record<string, unknown>,
  ) {
    const auditPayload = {
      action: eventName.endsWith('.created') ? 'CREATE' : 'UPDATE',
      entity: 'MasterUnit',
      entityId,
      module: 'master-data',
      metadata,
    };

    await Promise.all([
      this.eventBus.emit(eventName, metadata, {
        module: 'master-data',
      }),
      this.eventBus.emitAudit(auditPayload),
    ]);
  }
}
