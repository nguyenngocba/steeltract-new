import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, TransactionType } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';

type MaterialCostLine = {
  materialId: string;
  materialCode: string;
  materialName: string;
  unit?: string | null;
  requiredQty: number;
  issuedQty: number;
  returnedQty: number;
  netIssuedQty: number;
  consumedQty: number;
  scrapQty: number;
  unitPrice: number;
  unitPriceSource: 'ISSUE' | 'AVERAGE' | 'NONE';
  materialCost: number;
};

type ProductionOrderCostSummary = {
  productionOrderId: string;
  productionOrderNo: string;
  title: string;
  status: string;
  producedQty: number;
  component?: {
    id: string;
    code: string;
    name: string;
  } | null;
  project?: {
    id: string;
    code: string;
    name: string;
  } | null;
  requiredQty: number;
  issuedQty: number;
  returnedQty: number;
  netIssuedQty: number;
  consumedQty: number;
  scrapQty: number;
  materialCost: number;
  costPerUnit: number;
  materials: MaterialCostLine[];
};

type ComponentCostSummary = {
  componentId: string;
  componentCode: string;
  componentName: string;
  project?: {
    id: string;
    code: string;
    name: string;
  } | null;
  producedQty: number;
  materialCost: number;
  costPerUnit: number;
  productionOrders: ProductionOrderCostSummary[];
};

type ProjectCostSummary = {
  projectId: string;
  projectCode: string;
  projectName: string;
  materialCost: number;
  componentCount: number;
  productionOrderCount: number;
  components: ComponentCostSummary[];
  productionOrders: ProductionOrderCostSummary[];
};

type ProductionOrderWithCostRelations = Prisma.ProductionOrderGetPayload<{
  include: {
    component: { include: { project: true } };
    bom: {
      include: {
        items: {
          include: {
            material: { include: { unitMaster: true } };
          };
        };
      };
    };
    materialIssues: {
      include: {
        inventoryItem: { include: { unitMaster: true } };
      };
    };
    materialConsumptions: {
      include: {
        inventoryItem: { include: { unitMaster: true } };
      };
    };
  };
}>;

type IssueCost = {
  unitPrice: number;
  totalAmount: number;
};

@Injectable()
export class CostingEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async productionOrderCost(id: string): Promise<ProductionOrderCostSummary> {
    const order = await this.findProductionOrder(id);

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    return this.buildProductionOrderCost(order);
  }

  async componentCost(id: string): Promise<ComponentCostSummary> {
    const component = await this.prisma.component.findUnique({
      where: { id },
      include: {
        project: true,
        productionOrders: {
          include: this.productionOrderInclude(),
        },
      },
    });

    if (!component) {
      throw new NotFoundException('Component not found');
    }

    const productionOrders = await Promise.all(
      component.productionOrders.map((order) =>
        this.buildProductionOrderCost(order),
      ),
    );
    const materialCost = this.sum(productionOrders.map((row) => row.materialCost));
    const producedQty = this.sum(productionOrders.map((row) => row.producedQty));

    return {
      componentId: component.id,
      componentCode: component.code,
      componentName: component.name,
      project: component.project
        ? {
            id: component.project.id,
            code: component.project.code,
            name: component.project.name,
          }
        : null,
      producedQty,
      materialCost,
      costPerUnit: this.safeDivide(materialCost, producedQty),
      productionOrders,
    };
  }

  async projectCost(id: string): Promise<ProjectCostSummary> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        components: {
          include: {
            project: true,
            productionOrders: {
              include: this.productionOrderInclude(),
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const directOrders = await this.prisma.productionOrder.findMany({
      where: {
        projectId: id,
        componentId: null,
      },
      include: this.productionOrderInclude(),
    });

    const components = await Promise.all(
      project.components.map(async (component) => {
        const productionOrders = await Promise.all(
          component.productionOrders.map((order) =>
            this.buildProductionOrderCost(order),
          ),
        );
        const materialCost = this.sum(
          productionOrders.map((row) => row.materialCost),
        );
        const producedQty = this.sum(
          productionOrders.map((row) => row.producedQty),
        );

        return {
          componentId: component.id,
          componentCode: component.code,
          componentName: component.name,
          project: {
            id: project.id,
            code: project.code,
            name: project.name,
          },
          producedQty,
          materialCost,
          costPerUnit: this.safeDivide(materialCost, producedQty),
          productionOrders,
        } satisfies ComponentCostSummary;
      }),
    );
    const componentOrderIds = new Set(
      components.flatMap((component) =>
        component.productionOrders.map((order) => order.productionOrderId),
      ),
    );
    const directOrderCosts = await Promise.all(
      directOrders
        .filter((order) => !componentOrderIds.has(order.id))
        .map((order) => this.buildProductionOrderCost(order)),
    );
    const productionOrders = [
      ...components.flatMap((component) => component.productionOrders),
      ...directOrderCosts,
    ];
    const materialCost = this.sum(productionOrders.map((row) => row.materialCost));

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      materialCost,
      componentCount: components.length,
      productionOrderCount: productionOrders.length,
      components,
      productionOrders,
    };
  }

  private async buildProductionOrderCost(
    order: ProductionOrderWithCostRelations,
  ): Promise<ProductionOrderCostSummary> {
    const materialIds = [
      ...new Set([
        ...(order.bom?.items ?? []).map((item) => item.materialId),
        ...order.materialIssues.map((issue) => issue.inventoryItemId),
        ...order.materialConsumptions.map(
          (consumption) => consumption.inventoryItemId,
        ),
      ]),
    ];
    const [averageCosts, issueCosts] = await Promise.all([
      this.averageCostsByMaterial(materialIds),
      this.issueCostsByIssueId(order.materialIssues.map((issue) => issue.id)),
    ]);
    const materialMap = new Map<string, MaterialCostLine>();

    for (const item of order.bom?.items ?? []) {
      const requiredQty =
        Number(item.quantity ?? 0) *
        (1 + Number(item.wastePercent ?? 0) / 100) *
        Number(order.quantity ?? 1);
      materialMap.set(item.materialId, {
        materialId: item.materialId,
        materialCode: item.material?.code ?? item.materialId,
        materialName: item.material?.name ?? item.materialId,
        unit: item.material?.unitMaster?.symbol ?? item.material?.unit,
        requiredQty,
        issuedQty: 0,
        returnedQty: 0,
        netIssuedQty: 0,
        consumedQty: 0,
        scrapQty: 0,
        unitPrice: averageCosts.get(item.materialId) ?? 0,
        unitPriceSource: averageCosts.has(item.materialId) ? 'AVERAGE' : 'NONE',
        materialCost: 0,
      });
    }

    for (const issue of order.materialIssues) {
      const current =
        materialMap.get(issue.inventoryItemId) ??
        this.emptyMaterialLine(issue.inventoryItemId, issue.inventoryItem);
      const issuedQty = Number(issue.issuedQty ?? 0);
      const returnedQty = Number(issue.returnedQty ?? 0);
      const cost = issueCosts.get(issue.id);
      const averageCost = averageCosts.get(issue.inventoryItemId) ?? 0;
      const unitPrice =
        cost?.unitPrice && cost.unitPrice > 0 ? cost.unitPrice : averageCost;
      const materialCost =
        cost?.totalAmount && cost.totalAmount > 0
          ? cost.totalAmount
          : issuedQty * unitPrice;

      current.issuedQty += issuedQty;
      current.returnedQty += returnedQty;
      current.netIssuedQty += issuedQty - returnedQty;
      current.unitPrice = unitPrice;
      current.unitPriceSource =
        cost?.unitPrice && cost.unitPrice > 0
          ? 'ISSUE'
          : averageCost > 0
            ? 'AVERAGE'
            : 'NONE';
      current.materialCost += materialCost;
      materialMap.set(issue.inventoryItemId, current);
    }

    for (const consumption of order.materialConsumptions) {
      const current =
        materialMap.get(consumption.inventoryItemId) ??
        this.emptyMaterialLine(
          consumption.inventoryItemId,
          consumption.inventoryItem,
        );
      current.consumedQty += Number(consumption.consumedQty ?? 0);
      current.scrapQty += Number(consumption.scrapQty ?? 0);
      materialMap.set(consumption.inventoryItemId, current);
    }

    const materials = Array.from(materialMap.values()).sort((a, b) =>
      a.materialCode.localeCompare(b.materialCode),
    );
    const materialCost = this.sum(materials.map((row) => row.materialCost));
    const producedQty = Number(order.quantity ?? 1) || 1;
    const project = order.component?.project ?? (await this.findProject(order.projectId));

    return {
      productionOrderId: order.id,
      productionOrderNo: order.orderNo,
      title: order.title,
      status: order.status,
      producedQty,
      component: order.component
        ? {
            id: order.component.id,
            code: order.component.code,
            name: order.component.name,
          }
        : null,
      project: project
        ? {
            id: project.id,
            code: project.code,
            name: project.name,
          }
        : null,
      requiredQty: this.sum(materials.map((row) => row.requiredQty)),
      issuedQty: this.sum(materials.map((row) => row.issuedQty)),
      returnedQty: this.sum(materials.map((row) => row.returnedQty)),
      netIssuedQty: this.sum(materials.map((row) => row.netIssuedQty)),
      consumedQty: this.sum(materials.map((row) => row.consumedQty)),
      scrapQty: this.sum(materials.map((row) => row.scrapQty)),
      materialCost,
      costPerUnit: this.safeDivide(materialCost, producedQty),
      materials,
    };
  }

  private emptyMaterialLine(
    materialId: string,
    material?: {
      code: string;
      name: string;
      unit: string | null;
      unitMaster?: { symbol: string } | null;
    },
  ): MaterialCostLine {
    return {
      materialId,
      materialCode: material?.code ?? materialId,
      materialName: material?.name ?? materialId,
      unit: material?.unitMaster?.symbol ?? material?.unit,
      requiredQty: 0,
      issuedQty: 0,
      returnedQty: 0,
      netIssuedQty: 0,
      consumedQty: 0,
      scrapQty: 0,
      unitPrice: 0,
      unitPriceSource: 'NONE',
      materialCost: 0,
    };
  }

  private async findProductionOrder(id: string) {
    return this.prisma.productionOrder.findUnique({
      where: { id },
      include: this.productionOrderInclude(),
    });
  }

  private productionOrderInclude() {
    return {
      component: {
        include: {
          project: true,
        },
      },
      bom: {
        include: {
          items: {
            include: {
              material: {
                include: {
                  unitMaster: true,
                },
              },
            },
          },
        },
      },
      materialIssues: {
        include: {
          inventoryItem: {
            include: {
              unitMaster: true,
            },
          },
        },
      },
      materialConsumptions: {
        include: {
          inventoryItem: {
            include: {
              unitMaster: true,
            },
          },
        },
      },
    } satisfies Prisma.ProductionOrderInclude;
  }

  private async findProject(projectId?: string | null) {
    if (!projectId) return null;

    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  }

  private async issueCostsByIssueId(issueIds: string[]) {
    const costs = new Map<string, IssueCost>();
    if (!issueIds.length) return costs;

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        type: TransactionType.EXPORT,
        referenceModule: 'production_material_issue',
        referenceId: { in: issueIds },
      },
      select: {
        referenceId: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            totalAmount: true,
          },
        },
      },
    });

    for (const transaction of transactions) {
      if (!transaction.referenceId) continue;

      const current = costs.get(transaction.referenceId) ?? {
        unitPrice: 0,
        totalAmount: 0,
      };
      let quantity = 0;
      let value = 0;

      for (const item of transaction.items) {
        const lineQuantity = Math.abs(Number(item.quantity ?? 0));
        const lineValue =
          item.totalAmount != null
            ? Math.abs(Number(item.totalAmount))
            : item.unitPrice != null
              ? lineQuantity * Math.abs(Number(item.unitPrice))
              : 0;
        quantity += lineQuantity;
        value += lineValue;
      }

      current.totalAmount += value;
      current.unitPrice =
        quantity > 0 && value > 0 ? value / quantity : current.unitPrice;
      costs.set(transaction.referenceId, current);
    }

    return costs;
  }

  private async averageCostsByMaterial(materialIds: string[]) {
    const costs = new Map<string, number>();
    if (!materialIds.length) return costs;

    const lines = await this.prisma.inventoryTransactionItem.findMany({
      where: {
        inventoryItemId: { in: materialIds },
        quantity: { gt: 0 },
        OR: [{ unitPrice: { gt: 0 } }, { totalAmount: { gt: 0 } }],
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
      const value =
        line.totalAmount != null
          ? Math.abs(Number(line.totalAmount))
          : line.unitPrice != null
            ? Math.abs(Number(line.unitPrice)) * quantity
            : 0;
      if (quantity <= 0 || value <= 0) continue;

      const current = aggregates.get(line.inventoryItemId) ?? {
        quantity: 0,
        value: 0,
      };
      current.quantity += quantity;
      current.value += value;
      aggregates.set(line.inventoryItemId, current);
    }

    for (const [materialId, aggregate] of aggregates.entries()) {
      costs.set(materialId, this.safeDivide(aggregate.value, aggregate.quantity));
    }

    return costs;
  }

  private safeDivide(numerator: number, denominator: number) {
    return denominator > 0 ? numerator / denominator : 0;
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + Number(value ?? 0), 0);
  }
}
