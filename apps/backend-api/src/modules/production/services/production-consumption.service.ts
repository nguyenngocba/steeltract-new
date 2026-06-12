import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, ProductionMaterialLedgerEventType } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateProductionConsumptionDto,
  ListProductionConsumptionsDto,
} from '../dto/production.dto';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';

const epsilon = 0.000001;

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
    private readonly prisma: PrismaService,
    private readonly materialLedgerService: ProductionMaterialLedgerService,
  ) {}

  findAll(query: ListProductionConsumptionsDto = {}) {
    return this.prisma.productionMaterialConsumption.findMany({
      where: {
        productionOrderId: query.productionOrderId,
        inventoryItemId: query.inventoryItemId,
      },
      include: this.consumptionInclude(),
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 100,
      skip: query.page && query.limit ? (query.page - 1) * query.limit : undefined,
    });
  }

  findByProductionOrder(productionOrderId: string) {
    return this.findAll({ productionOrderId, limit: 200 });
  }

  async consume(
    productionOrderId: string,
    dto: CreateProductionConsumptionDto,
    actorId?: string,
  ) {
    const [order, material] = await Promise.all([
      this.prisma.productionOrder.findUnique({
        where: { id: productionOrderId },
        select: { id: true, orderNo: true },
      }),
      this.prisma.inventoryItem.findUnique({
        where: { id: dto.inventoryItemId },
        select: { id: true, code: true },
      }),
    ]);

    if (!order) {
      throw new NotFoundException('Production order not found');
    }
    if (!material) {
      throw new NotFoundException('Inventory material not found');
    }

    const [issues, previousConsumptions] = await Promise.all([
      this.prisma.productionMaterialIssue.findMany({
        where: {
          productionOrderId,
          inventoryItemId: dto.inventoryItemId,
          status: { in: ['ISSUED', 'RETURNED'] },
        },
        orderBy: { issuedDate: 'asc' },
      }),
      this.prisma.productionMaterialConsumption.findMany({
        where: {
          productionOrderId,
          inventoryItemId: dto.inventoryItemId,
        },
      }),
    ]);

    const issuedQty = this.sum(issues.map((issue) => Number(issue.issuedQty ?? 0)));
    const returnedQty = this.sum(issues.map((issue) => Number(issue.returnedQty ?? 0)));
    const previousConsumedQty = this.sum(
      previousConsumptions.map((row) => Number(row.consumedQty ?? 0)),
    );
    const previousScrapQty = this.sum(
      previousConsumptions.map((row) => Number(row.scrapQty ?? 0)),
    );
    const consumedQty = Number(dto.consumedQty ?? 0);
    const scrapQty = Number(dto.scrapQty ?? 0);
    const netIssuedQty = issuedQty - returnedQty;
    const remainingQty = netIssuedQty - previousConsumedQty - previousScrapQty;

    if (issuedQty <= epsilon || netIssuedQty <= epsilon) {
      throw new BadRequestException('No net issued material available to consume');
    }
    if (consumedQty > netIssuedQty + epsilon) {
      throw new BadRequestException('Consumed quantity cannot exceed net issued quantity');
    }
    if (consumedQty > remainingQty + epsilon) {
      throw new BadRequestException('Consumed quantity cannot exceed remaining quantity');
    }
    if (scrapQty > Math.max(remainingQty - consumedQty, 0) + epsilon) {
      throw new BadRequestException('Scrap quantity cannot exceed remaining quantity');
    }
    if (
      returnedQty +
        previousConsumedQty +
        previousScrapQty +
        consumedQty +
        scrapQty >
      issuedQty + epsilon
    ) {
      throw new BadRequestException('Return, consume, and scrap quantities cannot exceed issued quantity');
    }

    const ledgerQuantity = consumedQty + scrapQty;
    const ledgerLines = this.allocateConsumptionLedger(issues, previousConsumedQty + previousScrapQty, ledgerQuantity);

    return this.prisma.$transaction(async (tx) => {
      const consumption = await tx.productionMaterialConsumption.create({
        data: {
          productionOrderId,
          inventoryItemId: dto.inventoryItemId,
          issuedQty,
          consumedQty,
          scrapQty,
          returnedQty,
          remark: dto.remark,
          createdBy: actorId,
        },
        include: this.consumptionInclude(),
      });

      await this.materialLedgerService.createReservationEntries(
        {
          productionOrderId,
          eventType: ProductionMaterialLedgerEventType.CONSUME,
          lines: ledgerLines,
          remark:
            dto.remark ??
            `Consume material ${material.code}: consumed ${consumedQty}, scrap ${scrapQty}`,
          createdBy: actorId,
        },
        tx,
      );

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
        quantity: Math.max(Number(issue.issuedQty ?? 0) - Number(issue.returnedQty ?? 0), 0),
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
      throw new BadRequestException('Consumption quantity exceeds issued material buckets');
    }

    return lines;
  }

  private consumptionInclude() {
    return {
      productionOrder: {
        select: { id: true, orderNo: true, title: true, status: true },
      },
      inventoryItem: {
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          unitMaster: { select: { symbol: true } },
        },
      },
    } satisfies Prisma.ProductionMaterialConsumptionInclude;
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
  }
}
