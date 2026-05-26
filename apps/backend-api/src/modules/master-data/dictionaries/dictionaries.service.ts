import {
  BadRequestException,
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

    return delegate.findMany({
      where,
      include: config.include,
      orderBy: this.orderByFor(config.model),
    });
  }

  async create(domain: string, dto: DictionaryPayloadDto) {
    const config = this.getConfig(domain);
    const delegate = this.getDelegate(config.model);
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

  deactivate(domain: string, id: string) {
    return this.update(domain, id, {
      active: false,
    });
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
