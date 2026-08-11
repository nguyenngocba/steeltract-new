import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { EventBusService } from '../../../core/events/event-bus.service';
import {
  isMasterDataDomain,
  MasterDataDomain,
  masterDataDomains,
} from './dictionary.config';
import type {
  DictionaryPayloadDto,
  ListDictionaryDto,
  UpdateDictionaryPayloadDto,
} from './dto/dictionary.dto';

@Injectable()
export class DictionariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  listDomains() {
    return Object.entries(masterDataDomains).map(
      ([id, config]) => ({
        id,
        entity: config.entity,
      }),
    );
  }

  async findAll(domain: string, query: ListDictionaryDto) {
    const config = this.getConfig(domain);
    const delegate = this.getDelegate(config.model);
    const where = this.buildWhere(query);

    const records = await delegate.findMany({
      where,
      include: config.include,
      orderBy: this.orderByFor(config.model),
    });

    if (config.model !== 'masterWarehouse') return records;

    return records.map((record: Record<string, unknown>) => ({
      ...record,
      usageCount: Object.values(
        (record._count as Record<string, number> | undefined) ?? {},
      ).reduce(
        (sum: number, count) => sum + Number(count ?? 0),
        0,
      ),
    }));
  }

  async create(domain: string, dto: DictionaryPayloadDto) {
    const config = this.getConfig(domain);
    const delegate = this.getDelegate(config.model);
    await this.validateWarehouseType(
      config.model,
      dto.warehouseTypeId,
      true,
    );
    const data = await this.toData(config, dto);

    const record = await delegate.create({
      data,
      include: config.include,
    });

    await this.emitChanged(domain, 'created', config.entity, record);

    return record;
  }

  async update(
    domain: string,
    id: string,
    dto: UpdateDictionaryPayloadDto,
  ) {
    const config = this.getConfig(domain);
    const delegate = this.getDelegate(config.model);
    const existing = await delegate.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException('Master data record not found');
    }

    if (config.model === 'masterWarehouse' && dto.active === false) {
      await this.assertWarehouseCanDeactivate(id);
    }
    await this.validateWarehouseType(
      config.model,
      dto.warehouseTypeId,
      false,
    );

    const record = await delegate.update({
      where: {
        id,
      },
      data: await this.toData(config, dto),
      include: config.include,
    });

    await this.emitChanged(domain, 'updated', config.entity, record);

    return record;
  }

  async deactivate(domain: string, id: string) {
    return this.update(domain, id, {
      active: false,
    });
  }

  async dependencies(domain: string, id: string) {
    const config = this.getConfig(domain);
    if (config.model !== 'masterWarehouse') {
      throw new BadRequestException(
        'Dependency inspection is only available for warehouses.',
      );
    }

    const warehouse = await this.prisma.masterWarehouse.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const [
      locations,
      inventory,
      reservations,
      production,
      receipts,
      issues,
      transfers,
      dashboardDependencies,
    ] = await Promise.all([
      this.prisma.warehouseZone.count({ where: { warehouseId: id } }),
      this.prisma.inventoryLocationStock.count({
        where: {
          OR: [{ warehouseId: id }, { zone: { warehouseId: id } }],
        },
      }),
      this.prisma.productionMaterialReservationLine.count({
        where: { warehouseId: id },
      }),
      Promise.all([
        this.prisma.productionMaterialLedger.count({
          where: { warehouseId: id },
        }),
        this.prisma.productionMaterialIssue.count({
          where: { warehouseId: id },
        }),
      ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),
      this.countWarehouseTransactions(id, 'IMPORT'),
      this.countWarehouseTransactions(id, 'EXPORT'),
      this.countWarehouseTransactions(id, 'TRANSFER'),
      Promise.all([
        this.prisma.inventoryDashboardSnapshot.count({
          where: { warehouseId: id },
        }),
        this.prisma.inventoryMaterialSnapshot.count({
          where: { warehouseId: id },
        }),
        this.prisma.inventoryLocationSnapshot.count({
          where: { warehouseId: id },
        }),
      ]).then((counts) => counts.reduce((sum, count) => sum + count, 0)),
    ]);

    const dependencies = {
      inventory,
      locations,
      reservations,
      production,
      receipts,
      issues,
      transfers,
      dashboardDependencies,
    };

    return {
      warehouse,
      dependencies,
      total: Object.values(dependencies).reduce(
        (sum, count) => sum + count,
        0,
      ),
      canDeactivate: Object.values(dependencies).every((count) => count === 0),
    };
  }

  private getConfig(domain: string) {
    if (!isMasterDataDomain(domain)) {
      throw new NotFoundException('Master data domain not found');
    }

    return masterDataDomains[domain];
  }

  private getDelegate(model: string) {
    return (this.prisma as unknown as Record<string, any>)[model];
  }

  private buildWhere(query: ListDictionaryDto) {
    const search = (query.search || query.q)?.trim();

    return {
      active: query.active,
      OR: search
        ? [
            {
              code: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }

  private orderByFor(model: string) {
    if (
      [
        'masterQcStatus',
        'masterPriority',
        'masterMaterialStatus',
        'masterMaterialUsageType',
        'masterWorkflowStatus',
      ].includes(model)
    ) {
      return [
        {
          sortOrder: 'asc',
        },
        {
          code: 'asc',
        },
      ];
    }

    if (['masterWarehouse', 'masterWarehouseType'].includes(model)) {
      return [{ displayOrder: 'asc' }, { code: 'asc' }];
    }

    return {
      code: 'asc',
    };
  }

  private async toData(
    config: (typeof masterDataDomains)[MasterDataDomain],
    dto: DictionaryPayloadDto | UpdateDictionaryPayloadDto,
  ) {
    const data: Record<string, unknown> = {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      active: dto.active,
      color: dto.color,
      direction: dto.direction,
      affectsStock: dto.affectsStock,
      requiresApproval: dto.requiresApproval,
      sortOrder: dto.sortOrder,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
    };

    if (config.model === 'masterWarehouseType') {
      data.displayOrder = dto.displayOrder;
    }

    if (config.model === 'masterWarehouse') {
      Object.assign(data, {
        displayOrder: dto.displayOrder,
        allowReceipt: dto.allowReceipt,
        allowIssue: dto.allowIssue,
        allowProduction: dto.allowProduction,
        allowQc: dto.allowQc,
        allowDispatch: dto.allowDispatch,
        allowInstallation: dto.allowInstallation,
        allowSupplierReturn: dto.allowSupplierReturn,
        allowScrap: dto.allowScrap,
        allowReverse: dto.allowReverse,
        dashboardVisible: dto.dashboardVisible,
        planningVisible: dto.planningVisible,
        reportingVisible: dto.reportingVisible,
      });
    }

    if (config.model === 'masterTransactionType' && !dto.direction) {
      throw new BadRequestException(
        'Transaction type direction is required.',
      );
    }

    if (
      config.relationKey &&
      config.relationName &&
      dto[config.relationKey]
    ) {
      data[config.relationName] = {
        connect: {
          id: dto[config.relationKey],
        },
      };
    }

    if (config.relationKey) {
      delete data[config.relationKey];
    }

    return Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) => value !== undefined,
      ),
    );
  }

  private async validateWarehouseType(
    model: string,
    warehouseTypeId?: string,
    required = false,
  ) {
    if (model !== 'masterWarehouse') return;
    if (!warehouseTypeId) {
      if (required) {
        throw new BadRequestException('Warehouse type is required.');
      }
      return;
    }
    const warehouseType = await this.prisma.masterWarehouseType.findFirst({
      where: { id: warehouseTypeId, active: true },
      select: { id: true },
    });
    if (!warehouseType) {
      throw new BadRequestException('Warehouse type is invalid or inactive.');
    }
  }

  private countWarehouseTransactions(
    warehouseId: string,
    type: 'IMPORT' | 'EXPORT' | 'TRANSFER',
  ) {
    return this.prisma.inventoryTransaction.count({
      where: {
        type,
        OR: [
          { warehouseId },
          { items: { some: { warehouseId } } },
        ],
      },
    });
  }

  private async assertWarehouseCanDeactivate(id: string) {
    const result = await this.dependencies('warehouses', id);
    if (!result.canDeactivate) {
      throw new ConflictException({
        message: 'Warehouse is still referenced and cannot be deactivated.',
        dependencies: result.dependencies,
      });
    }
  }

  private async emitChanged(
    domain: string,
    action: 'created' | 'updated',
    entity: string,
    record: {
      id: string;
      code?: string;
      name?: string;
    },
  ) {
    const metadata = {
      domain,
      code: record.code,
      name: record.name,
    };

    await Promise.all([
      this.eventBus.emit(
        `master-data.${domain}.${action}`,
        metadata,
        {
          module: 'master-data',
        },
      ),
      this.eventBus.emitAudit({
        action: action === 'created' ? 'CREATE' : 'UPDATE',
        entity,
        entityId: record.id,
        module: 'master-data',
        metadata,
      }),
    ]);
  }
}
