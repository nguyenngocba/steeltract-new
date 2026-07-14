import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  Prisma,
  ProductionMaterialLedgerEventType,
  ProductionMaterialReservationStatus,
  ProductionMaterialReservationLineStatus,
} from '@prisma/client';

import { InventoryRepository } from '../../inventory/inventory.repository';

import {
  CreateProductionReservationDto,
  ListProductionReservationsDto,
  ReserveProductionReservationDto,
  ReleaseProductionReservationDto,
} from '../dto/production.dto';
import { productionMaterialEvents } from '../domain/production-material-contracts';
import { ProductionReservationRepository } from '../repositories/production-reservation.repository';
import { ProductionMaterialLedgerService } from './production-material-ledger.service';

const activeReservationStatuses: ProductionMaterialReservationStatus[] = [
  ProductionMaterialReservationStatus.RESERVED,
  ProductionMaterialReservationStatus.PARTIALLY_ISSUED,
];

const epsilon = 0.000001;

type StockBucket = {
  inventoryItemId: string;
  warehouseId?: string;
  warehouseCode?: string;
  warehouseName?: string;
  zoneId?: string;
  zoneCode?: string;
  zoneName?: string;
  slotId?: string;
  level?: string;
  quantity: number;
};

type ReservationAllocation = {
  warehouseId?: string;
  zoneId?: string;
  slotId?: string;
  level?: string;
  reservedQty: number;
};

type PreviewLine = {
  bomItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit?: string | null;
  requiredQty: number;
  availableQty: number;
  alreadyReservedQty: number;
  reservableQty: number;
  shortageQty: number;
  allocations: Array<
    ReservationAllocation & {
      warehouseCode?: string;
      warehouseName?: string;
      zoneCode?: string;
      zoneName?: string;
      availableQty: number;
    }
  >;
};

@Injectable()
export class ProductionReservationService {
  constructor(
    private readonly repository: ProductionReservationRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly materialLedgerService: ProductionMaterialLedgerService,
  ) {}

  findAll(query: ListProductionReservationsDto = {}) {
    return this.repository.findMany({
      productionOrderId: query.productionOrderId,
      status: query.status,
      take: query.limit,
      skip:
        query.page && query.limit ? (query.page - 1) * query.limit : undefined,
    });
  }

  async findOne(id: string) {
    const reservation = await this.repository.findById(id);

    if (!reservation) {
      throw new NotFoundException('Production material reservation not found');
    }

    return reservation;
  }

  async preview(productionOrderId: string) {
    const order = await this.getOrderWithBom(productionOrderId);
    const lines = await this.buildPreviewLines(order);

    return {
      productionOrderId: order.id,
      orderNo: order.orderNo,
      bomId: order.bomId,
      status: lines.some((line) => line.shortageQty > epsilon)
        ? 'SHORTAGE'
        : 'READY',
      totalRequiredQty: this.sum(lines.map((line) => line.requiredQty)),
      totalAvailableQty: this.sum(lines.map((line) => line.availableQty)),
      totalAlreadyReservedQty: this.sum(
        lines.map((line) => line.alreadyReservedQty),
      ),
      totalReservableQty: this.sum(lines.map((line) => line.reservableQty)),
      totalShortageQty: this.sum(lines.map((line) => line.shortageQty)),
      lines,
    };
  }

  async create(
    productionOrderId: string,
    dto: CreateProductionReservationDto,
    actorId?: string,
  ) {
    const order = await this.getOrderWithBom(productionOrderId);
    const reservation = await this.repository.create({
      reservationNo: await this.nextReservationNo(order.orderNo),
      productionOrderId: order.id,
      bomId: order.bomId,
      expiresAt: dto.expiresAt,
      note: dto.note,
      lines: {
        create: (order.bom?.items ?? []).map((item) => ({
          bomItemId: item.id,
          inventoryItemId: item.materialId,
          requiredQty:
            item.quantity * (1 + item.wastePercent / 100) * order.quantity,
          status: ProductionMaterialReservationLineStatus.OPEN,
        })),
      },
    });

    if (dto.autoReserve) {
      return this.reserve(reservation.id, { note: dto.note }, actorId);
    }

    return reservation;
  }

  async reserve(
    id: string,
    dto: ReserveProductionReservationDto = {},
    actorId?: string,
  ) {
    const existing = await this.findOne(id);
    if (existing.status !== ProductionMaterialReservationStatus.DRAFT) {
      throw new BadRequestException('Only draft reservations can be reserved');
    }

    const order = await this.getOrderWithBom(existing.productionOrderId);
    const previewLines = await this.buildPreviewLines(order, existing.id);
    const shortages = previewLines.filter((line) => line.shortageQty > epsilon);
    if (shortages.length) {
      throw new BadRequestException(
        `Không đủ vật tư kho SX để giữ chỗ: ${shortages
          .map(
            (line) =>
              `${line.materialCode} thiếu ${line.shortageQty.toLocaleString('vi-VN')}`,
          )
          .join('; ')}`,
      );
    }

    await this.repository.transaction(async (tx) => {
      await this.repository.deleteLines(id, tx);

      const ledgerLines: Array<{
        inventoryItemId: string;
        warehouseId?: string;
        zoneId?: string;
        slotId?: string;
        level?: string;
        quantity: number;
      }> = [];

      for (const line of previewLines) {
        for (const allocation of line.allocations) {
          if (allocation.reservedQty <= epsilon) continue;
          await this.repository.createLine(
            {
              reservationId: id,
              bomItemId: line.bomItemId,
              inventoryItemId: line.materialId,
              warehouseId: allocation.warehouseId,
              zoneId: allocation.zoneId,
              slotId: allocation.slotId,
              level: allocation.level,
              requiredQty: allocation.reservedQty,
              reservedQty: allocation.reservedQty,
              status: ProductionMaterialReservationLineStatus.OPEN,
            },
            tx,
          );
          ledgerLines.push({
            inventoryItemId: line.materialId,
            warehouseId: allocation.warehouseId,
            zoneId: allocation.zoneId,
            slotId: allocation.slotId,
            level: allocation.level,
            quantity: allocation.reservedQty,
          });
        }
      }

      const updatedReservation = await this.repository.updateReservation(
        id,
        {
          status: ProductionMaterialReservationStatus.RESERVED,
          reservedAt: new Date(),
          reservedBy: actorId,
          note: dto.note ?? existing.note,
        },
        tx,
      );

      await this.materialLedgerService.createReservationEntries(
        {
          productionOrderId: existing.productionOrderId,
          reservationId: existing.id,
          eventType: ProductionMaterialLedgerEventType.RESERVE,
          lines: ledgerLines,
          remark: dto.note ?? `Reservation ${existing.reservationNo} reserved`,
          createdBy: actorId,
        },
        tx,
      );
      await this.materialLedgerService.createMaterialEvent(
        {
          eventName: productionMaterialEvents.reserved,
          productionOrderId: existing.productionOrderId,
          reservationId: existing.id,
          quantity: this.sum(ledgerLines.map((line) => line.quantity)),
          actorId,
          sourceVersion: updatedReservation.updatedAt.toISOString(),
        },
        tx,
      );
    });

    return this.findOne(id);
  }

  async release(
    id: string,
    dto: ReleaseProductionReservationDto = {},
    actorId?: string,
  ) {
    const reservation = await this.findOne(id);
    if (!activeReservationStatuses.includes(reservation.status)) {
      throw new BadRequestException('Only active reservations can be released');
    }

    await this.repository.transaction(async (tx) => {
      const releasedQuantity = this.sum(
        reservation.lines.map((line) =>
          Math.max(
            Number(line.reservedQty ?? 0) - Number(line.issuedQty ?? 0),
            0,
          ),
        ),
      );
      await this.materialLedgerService.createReservationEntries(
        {
          productionOrderId: reservation.productionOrderId,
          reservationId: reservation.id,
          eventType: ProductionMaterialLedgerEventType.RELEASE,
          lines: reservation.lines.map((line) => ({
            inventoryItemId: line.inventoryItemId,
            warehouseId: line.warehouseId,
            zoneId: line.zoneId,
            slotId: line.slotId,
            level: line.level,
            quantity: -Math.max(
              Number(line.reservedQty ?? 0) - Number(line.issuedQty ?? 0),
              0,
            ),
          })),
          remark:
            dto.note ?? `Reservation ${reservation.reservationNo} released`,
          createdBy: actorId,
        },
        tx,
      );

      const updatedReservation = await this.repository.updateReservation(
        id,
        {
          status: ProductionMaterialReservationStatus.CANCELLED,
          releasedAt: new Date(),
          note: dto.note ?? reservation.note,
          lines: {
            updateMany: {
              where: {},
              data: {
                status: ProductionMaterialReservationLineStatus.RELEASED,
                reservedQty: 0,
              },
            },
          },
        },
        tx,
      );
      if (releasedQuantity > epsilon) {
        await this.materialLedgerService.createMaterialEvent(
          {
            eventName: productionMaterialEvents.released,
            productionOrderId: reservation.productionOrderId,
            reservationId: reservation.id,
            quantity: releasedQuantity,
            actorId,
            sourceVersion: updatedReservation.updatedAt.toISOString(),
          },
          tx,
        );
      }
    });

    return this.findOne(id);
  }

  async expire(
    id: string,
    dto: ReleaseProductionReservationDto = {},
    actorId?: string,
  ) {
    const reservation = await this.findOne(id);
    if (
      ![
        ProductionMaterialReservationStatus.DRAFT,
        ...activeReservationStatuses,
      ].includes(reservation.status)
    ) {
      throw new BadRequestException('Reservation cannot be expired');
    }

    await this.repository.transaction(async (tx) => {
      const releasedQuantity = this.sum(
        reservation.lines.map((line) =>
          Math.max(
            Number(line.reservedQty ?? 0) - Number(line.issuedQty ?? 0),
            0,
          ),
        ),
      );
      await this.materialLedgerService.createReservationEntries(
        {
          productionOrderId: reservation.productionOrderId,
          reservationId: reservation.id,
          eventType: ProductionMaterialLedgerEventType.RELEASE,
          lines: reservation.lines.map((line) => ({
            inventoryItemId: line.inventoryItemId,
            warehouseId: line.warehouseId,
            zoneId: line.zoneId,
            slotId: line.slotId,
            level: line.level,
            quantity: -Math.max(
              Number(line.reservedQty ?? 0) - Number(line.issuedQty ?? 0),
              0,
            ),
          })),
          remark:
            dto.note ?? `Reservation ${reservation.reservationNo} expired`,
          createdBy: actorId,
        },
        tx,
      );

      const updatedReservation = await this.repository.updateReservation(
        id,
        {
          status: ProductionMaterialReservationStatus.EXPIRED,
          releasedAt: new Date(),
          note: dto.note ?? reservation.note,
          lines: {
            updateMany: {
              where: {},
              data: {
                status: ProductionMaterialReservationLineStatus.RELEASED,
                reservedQty: 0,
              },
            },
          },
        },
        tx,
      );
      if (releasedQuantity > epsilon) {
        await this.materialLedgerService.createMaterialEvent(
          {
            eventName: productionMaterialEvents.released,
            productionOrderId: reservation.productionOrderId,
            reservationId: reservation.id,
            quantity: releasedQuantity,
            actorId,
            sourceVersion: updatedReservation.updatedAt.toISOString(),
          },
          tx,
        );
      }
    });

    return this.findOne(id);
  }

  private async buildPreviewLines(
    order: Prisma.ProductionOrderGetPayload<{
      include: {
        bom: {
          include: {
            items: {
              include: { material: { include: { unitMaster: true } } };
            };
          };
        };
      };
    }>,
    excludeReservationId?: string,
  ): Promise<PreviewLine[]> {
    const bomItems = order.bom?.items ?? [];
    const materialIds = [...new Set(bomItems.map((item) => item.materialId))];
    const [stockBuckets, reservedByBucket] = await Promise.all([
      this.productionStockBuckets(materialIds),
      this.activeReservedQuantityByBucket(materialIds, excludeReservationId),
    ]);

    return bomItems.map((item) => {
      const requiredQty =
        item.quantity * (1 + item.wastePercent / 100) * order.quantity;
      const buckets = [...(stockBuckets.get(item.materialId) ?? [])]
        .filter((bucket) => bucket.quantity > epsilon)
        .sort((a, b) =>
          `${a.zoneCode ?? ''}-${a.slotId ?? ''}-${a.level ?? ''}`.localeCompare(
            `${b.zoneCode ?? ''}-${b.slotId ?? ''}-${b.level ?? ''}`,
          ),
        );
      let requiredRemaining = requiredQty;

      const allocations: PreviewLine['allocations'] = [];
      for (const bucket of buckets) {
        const bucketReservedQty =
          reservedByBucket.get(this.bucketKey(bucket)) ?? 0;
        const freeQty = Math.max(bucket.quantity - bucketReservedQty, 0);
        if (freeQty <= epsilon || requiredRemaining <= epsilon) continue;
        const reserveQty = Math.min(freeQty, requiredRemaining);
        allocations.push({
          warehouseId: bucket.warehouseId,
          warehouseCode: bucket.warehouseCode,
          warehouseName: bucket.warehouseName,
          zoneId: bucket.zoneId,
          zoneCode: bucket.zoneCode,
          zoneName: bucket.zoneName,
          slotId: bucket.slotId,
          level: bucket.level,
          availableQty: freeQty,
          reservedQty: reserveQty,
        });
        requiredRemaining -= reserveQty;
      }

      const availableQty = this.sum(buckets.map((bucket) => bucket.quantity));
      const alreadyReservedQty = this.sum(
        buckets.map(
          (bucket) => reservedByBucket.get(this.bucketKey(bucket)) ?? 0,
        ),
      );
      const reservableQty = this.sum(
        allocations.map((allocation) => allocation.reservedQty),
      );

      return {
        bomItemId: item.id,
        materialId: item.materialId,
        materialCode: item.material.code,
        materialName: item.material.name,
        unit: item.material.unitMaster?.symbol ?? item.material.unit,
        requiredQty,
        availableQty,
        alreadyReservedQty,
        reservableQty,
        shortageQty: Math.max(requiredQty - reservableQty, 0),
        allocations,
      };
    });
  }

  private async getOrderWithBom(productionOrderId: string) {
    const order = await this.repository.findOrderWithBom(productionOrderId);

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    if (!order.bom || !order.bom.items.length) {
      throw new BadRequestException(
        'Production order must have an active BOM before material reservation',
      );
    }

    return order;
  }

  private async productionStockBuckets(materialIds: string[]) {
    const buckets = new Map<string, StockBucket[]>();
    if (!materialIds.length) return buckets;

    const productionWarehouse = await this.inventoryRepository.findWarehouseByCode(
      'PRODUCTION',
    );

    if (!productionWarehouse) return buckets;

    const locationStocks = await this.inventoryRepository.findPositiveLocationStocks(
      materialIds,
      productionWarehouse.id,
      'PRODUCTION',
    );

    for (const row of locationStocks) {
      this.addBucketQuantity(buckets, row.inventoryItemId, {
        inventoryItemId: row.inventoryItemId,
        warehouseId: row.warehouseId ?? row.zone?.warehouseId ?? undefined,
        warehouseCode: row.zone?.warehouse?.code ?? productionWarehouse.code,
        warehouseName: row.zone?.warehouse?.name ?? productionWarehouse.name,
        zoneId: row.zoneId ?? undefined,
        zoneCode: row.zone?.code ?? undefined,
        zoneName: row.zone?.name ?? undefined,
        slotId: row.slotId ?? undefined,
        level: row.level ?? undefined,
        quantity: Number(row.quantity ?? 0),
      });
    }

    return buckets;
  }

  private async activeReservedQuantityByBucket(
    materialIds: string[],
    excludeReservationId?: string,
  ) {
    const reservedByBucket = new Map<string, number>();
    if (!materialIds.length) return reservedByBucket;

    const lines = await this.repository.findActiveReservationLines(
      materialIds,
      activeReservationStatuses,
      excludeReservationId,
    );

    for (const line of lines) {
      const openQty = Math.max(
        Number(line.reservedQty ?? 0) - Number(line.issuedQty ?? 0),
        0,
      );
      const key = this.bucketKey({
        inventoryItemId: line.inventoryItemId,
        warehouseId: line.warehouseId ?? undefined,
        zoneId: line.zoneId ?? undefined,
        slotId: line.slotId ?? undefined,
        level: line.level ?? undefined,
      });
      reservedByBucket.set(key, (reservedByBucket.get(key) ?? 0) + openQty);
    }

    return reservedByBucket;
  }

  private addBucketQuantity(
    buckets: Map<string, StockBucket[]>,
    materialId: string,
    incoming: StockBucket,
  ) {
    const rows = buckets.get(materialId) ?? [];
    const existing = rows.find(
      (row) =>
        (row.warehouseId ?? null) === (incoming.warehouseId ?? null) &&
        (row.zoneId ?? null) === (incoming.zoneId ?? null) &&
        (row.slotId ?? null) === (incoming.slotId ?? null) &&
        (row.level ?? null) === (incoming.level ?? null),
    );

    if (existing) {
      existing.quantity += incoming.quantity;
    } else {
      rows.push(incoming);
    }
    buckets.set(materialId, rows);
  }

  private bucketKey(row: {
    inventoryItemId: string;
    warehouseId?: string | null;
    zoneId?: string | null;
    slotId?: string | null;
    level?: string | null;
  }) {
    return [
      row.inventoryItemId,
      row.warehouseId ?? '',
      row.zoneId ?? '',
      row.slotId ?? '',
      row.level ?? '',
    ].join('|');
  }

  private async nextReservationNo(_orderNo: string) {
    return this.repository.nextReservationNo();
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + value, 0);
  }
}
