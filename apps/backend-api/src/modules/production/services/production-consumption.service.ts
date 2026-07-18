import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  ProductionMaterialLedgerEventType,
  ProductionOrderStatus,
} from '@prisma/client';

import { InventoryRepository } from '../../inventory/inventory.repository';

import {
  CreateProductionConsumptionDto,
  ListProductionConsumptionsDto,
} from '../dto/production.dto';
import { productionMaterialEvents } from '../domain/production-material-contracts';
import { ProductionConsumptionRepository } from '../repositories/production-consumption.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';

const epsilon = 0.000001;

const consumptionOrderStatuses = new Set<ProductionOrderStatus>([
  ProductionOrderStatus.IN_PROGRESS,
  ProductionOrderStatus.PAUSED,
]);

type IssueBucket = {
  inventoryItemId: string;
  warehouseId?: string | null;
  zoneId?: string | null;
  slotId?: string | null;
  level?: string | null;
  quantity: number;
};

@Injectable()
export class ProductionConsumptionService {
  constructor(
    private readonly repository: ProductionConsumptionRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly materialLedgerService: ProductionMaterialLedgerService,
  ) {}

  findAll(query: ListProductionConsumptionsDto = {}) {
    return this.repository.findMany(
      {
        productionOrderId: query.productionOrderId,
        inventoryItemId: query.inventoryItemId,
      },
      {
        take: query.limit ?? 100,
        skip:
          query.page && query.limit
            ? (query.page - 1) * query.limit
            : undefined,
      },
    );
  }

  findByProductionOrder(productionOrderId: string) {
    return this.findAll({ productionOrderId, limit: 200 });
  }

  async consume(
    productionOrderId: string,
    dto: CreateProductionConsumptionDto,
    actorId?: string,
  ) {
    return this.repository.transaction(async (tx) => {
      const [order, material] = await Promise.all([
        this.repository.findOrderForConsumption(productionOrderId, tx),
        this.inventoryRepository.findItemById(dto.inventoryItemId, tx),
      ]);

      if (!order) {
        throw new NotFoundException('Production order not found');
      }
      if (!consumptionOrderStatuses.has(order.status)) {
        throw new BadRequestException(
          `Production order state ${order.status} does not allow consumption`,
        );
      }
      if (!material) {
        throw new NotFoundException('Inventory material not found');
      }
      const materialUnit = material.unitMaster?.symbol ?? material.unit;
      if (!materialUnit) {
        throw new BadRequestException('Inventory material unit is required');
      }

      const [issues, previousConsumptions] = await Promise.all([
        this.repository.findIssuesForConsumption(
          productionOrderId,
          dto.inventoryItemId,
          tx,
        ),
        this.repository.findConsumptionsForMaterial(
          productionOrderId,
          dto.inventoryItemId,
          tx,
        ),
      ]);

      const issuedQty = this.sum(
        issues.map((issue) => Number(issue.issuedQty ?? 0)),
      );
      const returnedQty = this.sum(
        issues.map((issue) => Number(issue.returnedQty ?? 0)),
      );
      const previousConsumedQty = this.sum(
        previousConsumptions.map((row) => Number(row.consumedQty ?? 0)),
      );
      const previousScrapQty = this.sum(
        previousConsumptions.map((row) => Number(row.scrapQty ?? 0)),
      );
      const consumedQty = Number(dto.consumedQty ?? 0);
      const scrapQty = Number(dto.scrapQty ?? 0);
      const netIssuedQty = issuedQty - returnedQty;
      const remainingQty =
        netIssuedQty - previousConsumedQty - previousScrapQty;

      if (issuedQty <= epsilon || netIssuedQty <= epsilon) {
        throw new BadRequestException(
          'No net issued material available to consume',
        );
      }
      if (consumedQty > netIssuedQty + epsilon) {
        throw new BadRequestException(
          'Consumed quantity cannot exceed net issued quantity',
        );
      }
      if (consumedQty > remainingQty + epsilon) {
        throw new BadRequestException(
          'Consumed quantity cannot exceed remaining quantity',
        );
      }
      if (scrapQty > Math.max(remainingQty - consumedQty, 0) + epsilon) {
        throw new BadRequestException(
          'Scrap quantity cannot exceed remaining quantity',
        );
      }
      if (
        returnedQty +
          previousConsumedQty +
          previousScrapQty +
          consumedQty +
          scrapQty >
        issuedQty + epsilon
      ) {
        throw new BadRequestException(
          'Return, consume, and scrap quantities cannot exceed issued quantity',
        );
      }

      const ledgerLines = this.allocateConsumptionLedger(
        issues,
        previousConsumedQty + previousScrapQty,
        consumedQty,
      );

      const consumption = await this.repository.create(
        {
          productionOrderId,
          inventoryItemId: dto.inventoryItemId,
          issuedQty,
          consumedQty,
          scrapQty,
          returnedQty,
          remark: dto.remark,
          createdBy: actorId,
        },
        tx,
      );

      if (consumedQty > epsilon) {
        await this.materialLedgerService.createReservationEntries(
          {
            productionOrderId,
            eventType: ProductionMaterialLedgerEventType.CONSUME,
            lines: ledgerLines,
            remark:
              dto.remark ??
              `Consume material ${material.code}: consumed ${consumedQty}`,
            createdBy: actorId,
          },
          tx,
        );
        await this.materialLedgerService.createMaterialEvent(
          {
            eventName: productionMaterialEvents.consumed,
            productionOrderId,
            consumptionId: consumption.id,
            inventoryItemId: dto.inventoryItemId,
            quantity: consumedQty,
            unit: materialUnit,
            resultingBalance: Math.max(remainingQty - consumedQty, 0),
            actorId,
            occurredAt: consumption.createdAt,
            sourceVersion: consumption.createdAt.toISOString(),
          },
          tx,
        );
      }

      return consumption;
    });
  }

  private allocateConsumptionLedger(
    issues: Array<{
      inventoryItemId: string;
      warehouseId: string | null;
      zoneId: string | null;
      slotId: string | null;
      level: string | null;
      issuedQty: number;
      returnedQty: number;
    }>,
    alreadyConsumedQty: number,
    quantity: number,
  ) {
    const buckets: IssueBucket[] = issues
      .map((issue) => ({
        inventoryItemId: issue.inventoryItemId,
        warehouseId: issue.warehouseId,
        zoneId: issue.zoneId,
        slotId: issue.slotId,
        level: issue.level,
        quantity: Math.max(
          Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0),
          0,
        ),
      }))
      .filter((bucket) => bucket.quantity > epsilon);

    let skip = alreadyConsumedQty;
    for (const bucket of buckets) {
      const skipped = Math.min(bucket.quantity, skip);
      bucket.quantity -= skipped;
      skip -= skipped;
      if (skip <= epsilon) break;
    }

    let remaining = quantity;
    const lines: IssueBucket[] = [];
    for (const bucket of buckets) {
      if (bucket.quantity <= epsilon || remaining <= epsilon) continue;
      const take = Math.min(bucket.quantity, remaining);
      lines.push({ ...bucket, quantity: take });
      remaining -= take;
    }

    if (remaining > epsilon) {
      throw new BadRequestException(
        'Consumption quantity exceeds issued material buckets',
      );
    }

    return lines;
  }

  private sum(values: number[]) {
    return values.reduce(
      (total, value) => total + (Number.isFinite(value) ? value : 0),
      0,
    );
  }
}
