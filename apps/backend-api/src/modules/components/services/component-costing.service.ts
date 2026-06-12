import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class ComponentCostingService {
  constructor(private readonly prisma: PrismaService) {}

  async findByComponent(componentId: string) {
    await this.assertComponent(componentId);

    const costing = await this.prisma.componentCosting.findUnique({
      where: { componentId },
      include: this.costingInclude(),
    });

    if (costing) return costing;

    return this.preview(componentId);
  }

  async recalculate(componentId: string) {
    const component = await this.getComponentWithProduction(componentId);
    const order = this.pickProductionOrder(component);
    const consumptions = await this.prisma.productionMaterialConsumption.findMany({
      where: { productionOrderId: order.id },
      include: {
        inventoryItem: true,
      },
    });

    if (!consumptions.length) {
      throw new BadRequestException(
        'Component production order must have consumption records before costing',
      );
    }

    const materialIds = [
      ...new Set(consumptions.map((row) => row.inventoryItemId)),
    ];
    const averageCosts = await this.averageCostsByMaterial(materialIds);
    const actualMaterialCost = consumptions.reduce((sum, row) => {
      const costQty = Number(row.consumedQty ?? 0) + Number(row.scrapQty ?? 0);
      return sum + costQty * (averageCosts.get(row.inventoryItemId) ?? 0);
    }, 0);
    const estimatedMaterialCost = await this.estimatedMaterialCost(order);
    const laborCost = 0;
    const machineCost = 0;
    const overheadCost = 0;
    const estimatedCost =
      Number(component.estimatedCost ?? 0) || estimatedMaterialCost;
    const actualCost =
      actualMaterialCost + laborCost + machineCost + overheadCost;
    const varianceCost = actualCost - estimatedCost;

    return this.prisma.$transaction(async (tx) => {
      const costing = await tx.componentCosting.upsert({
        where: { componentId },
        create: {
          componentId,
          productionOrderId: order.id,
          estimatedMaterialCost,
          actualMaterialCost,
          laborCost,
          machineCost,
          overheadCost,
          estimatedCost,
          actualCost,
          varianceCost,
        },
        update: {
          productionOrderId: order.id,
          estimatedMaterialCost,
          actualMaterialCost,
          laborCost,
          machineCost,
          overheadCost,
          estimatedCost,
          actualCost,
          varianceCost,
        },
        include: this.costingInclude(),
      });

      await tx.component.update({
        where: { id: componentId },
        data: {
          estimatedCost,
          actualCost,
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'RECALCULATE_COSTING',
          entity: 'Component',
          entityId: componentId,
          module: 'components',
          metadata: {
            productionOrderId: order.id,
            estimatedCost,
            actualCost,
            varianceCost,
          },
        },
      });

      return costing;
    });
  }

  private async preview(componentId: string) {
    const component = await this.getComponentWithProduction(componentId);
    const order = this.pickProductionOrder(component);

    return {
      id: null,
      componentId,
      productionOrderId: order.id,
      estimatedMaterialCost: await this.estimatedMaterialCost(order),
      actualMaterialCost: 0,
      laborCost: 0,
      machineCost: 0,
      overheadCost: 0,
      estimatedCost: Number(component.estimatedCost ?? 0),
      actualCost: Number(component.actualCost ?? 0),
      varianceCost:
        Number(component.actualCost ?? 0) - Number(component.estimatedCost ?? 0),
      createdAt: null,
      updatedAt: null,
      component,
      productionOrder: order,
    };
  }

  private async assertComponent(componentId: string) {
    const exists = await this.prisma.component.findUnique({
      where: { id: componentId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Component not found');
    }
  }

  private async getComponentWithProduction(componentId: string) {
    const component = await this.prisma.component.findUnique({
      where: { id: componentId },
      include: {
        project: true,
        productionOrders: {
          include: {
            bom: {
              include: {
                items: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    if (!component.productionOrders.length) {
      throw new BadRequestException('Component must have a production order before costing');
    }

    return component;
  }

  private pickProductionOrder(
    component: Prisma.ComponentGetPayload<{
      include: {
        project: true;
        productionOrders: {
          include: {
            bom: {
              include: {
                items: true;
              };
            };
          };
        };
      };
    }>,
  ) {
    return component.productionOrders[0];
  }

  private async averageCostsByMaterial(materialIds: string[]) {
    const costs = new Map<string, number>();
    if (!materialIds.length) return costs;

    const lines = await this.prisma.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        quantity: { gt: 0 },
        OR: [
          { unitPrice: { gt: 0 } },
          { totalAmount: { gt: 0 } },
        ],
      },
      select: {
        inventoryItemId: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
      },
    });

    const aggregates = new Map<string, { quantity: number; value: number }>();
    for (const line of lines) {
      const quantity = Math.abs(Number(line.quantity ?? 0));
      const value = Number(
        line.totalAmount ??
          (line.unitPrice != null ? Number(line.unitPrice) * quantity : 0),
      );
      const current = aggregates.get(line.inventoryItemId) ?? {
        quantity: 0,
        value: 0,
      };
      current.quantity += quantity;
      current.value += value;
      aggregates.set(line.inventoryItemId, current);
    }

    for (const [materialId, aggregate] of aggregates.entries()) {
      costs.set(
        materialId,
        aggregate.quantity > 0 ? aggregate.value / aggregate.quantity : 0,
      );
    }

    return costs;
  }

  private async estimatedMaterialCost(
    order: {
      quantity: number;
      bom?: {
        items: Array<{
          materialId: string;
          quantity: number;
          wastePercent: number;
        }>;
      } | null;
    },
  ) {
    const items = order.bom?.items ?? [];
    const materialIds = [...new Set(items.map((item) => item.materialId))];
    const averageCosts = await this.averageCostsByMaterial(materialIds);

    return items.reduce((sum, item) => {
      const requiredQty =
        Number(item.quantity ?? 0) *
        (1 + Number(item.wastePercent ?? 0) / 100) *
        Number(order.quantity ?? 1);
      return sum + requiredQty * (averageCosts.get(item.materialId) ?? 0);
    }, 0);
  }

  private costingInclude() {
    return {
      component: {
        select: { id: true, code: true, name: true, status: true },
      },
      productionOrder: {
        select: { id: true, orderNo: true, title: true, status: true },
      },
    } satisfies Prisma.ComponentCostingInclude;
  }
}
