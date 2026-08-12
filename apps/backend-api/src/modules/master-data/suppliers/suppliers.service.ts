import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../core/prisma/prisma.service';

type SupplierPayload = {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
};

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search?: string) {
    const keyword = search?.trim();

    return this.prisma.supplier.findMany({
      where: keyword
        ? {
            OR: [
              {
                code: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
              {
                contact: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
              {
                phone: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getById(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    });
  }

  async getCockpitSummary() {
    const [suppliers, usedSuppliers] = await Promise.all([
      this.prisma.supplier.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.inventoryTransaction.groupBy({
        by: ['supplierId'],
        where: {
          supplierId: {
            not: null,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const usedMap = new Map(
      usedSuppliers
        .filter((row) => row.supplierId)
        .map((row) => [row.supplierId, row._count._all]),
    );

    return {
      total: suppliers.length,
      active: suppliers.length,
      inactive: 0,
      usedInInventory: usedMap.size,
      topSuppliers: suppliers
        .map((supplier) => ({
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
          count: usedMap.get(supplier.id) ?? 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recentSuppliers: suppliers.slice(0, 5),
      mostUsedSuppliers: suppliers
        .map((supplier) => ({
          id: supplier.id,
          code: supplier.code,
          name: supplier.name,
          count: usedMap.get(supplier.id) ?? 0,
        }))
        .filter((supplier) => supplier.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }

  async getCockpitDetail(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return null;
    }

    const [transactions, score] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: {
          supplierId: id,
          type: 'IMPORT',
        },
        include: {
          items: {
            include: {
              inventoryItem: true,
              unit: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
        },
        take: 100,
      }),
      this.prisma.supplierScore.findFirst({
        where: {
          supplierName: {
            equals: supplier.name,
            mode: 'insensitive',
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    const materialMap = new Map<
      string,
      {
        id: string;
        code: string;
        name: string;
        unit?: string | null;
        inboundCount: number;
        totalQuantity: number;
        lastInboundAt?: Date;
      }
    >();

    const inboundHistory = transactions.flatMap((transaction) =>
      transaction.items.map((item) => {
        const material = item.inventoryItem;
        const existing = materialMap.get(material.id) ?? {
          id: material.id,
          code: material.code,
          name: material.name,
          unit: item.unit?.symbol ?? material.unit,
          inboundCount: 0,
          totalQuantity: 0,
          lastInboundAt: undefined,
        };

        existing.inboundCount += 1;
        existing.totalQuantity += Number(item.quantity ?? 0);
        existing.lastInboundAt = existing.lastInboundAt
          ? existing.lastInboundAt > transaction.transactionDate
            ? existing.lastInboundAt
            : transaction.transactionDate
          : transaction.transactionDate;
        materialMap.set(material.id, existing);

        return {
          id: item.id,
          inboundNo: transaction.transactionNo ?? transaction.code,
          date: transaction.transactionDate,
          materialId: material.id,
          materialCode: material.code,
          materialName: material.name,
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          totalAmount: Number(
            item.totalAmount ??
              Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0),
          ),
          unit: item.unit?.symbol ?? material.unit,
        };
      }),
    );

    return {
      supplier,
      materials: Array.from(materialMap.values()).sort(
        (a, b) => b.totalQuantity - a.totalQuantity,
      ),
      inboundHistory,
      rating: score
        ? {
            quality: Number(score.quality ?? 0),
            delivery: Number(score.delivery ?? 0),
            pricing: Number(score.pricing ?? 0),
            overall: Number(score.overall ?? 0),
            updatedAt: score.updatedAt,
          }
        : {
            quality: 0,
            delivery: 0,
            pricing: 0,
            overall: 0,
            updatedAt: null,
          },
    };
  }

  async getCockpitEvaluations() {
    const [suppliers, scores, usage] = await Promise.all([
      this.prisma.supplier.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.supplierScore.findMany({
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      this.prisma.inventoryTransaction.groupBy({
        by: ['supplierId'],
        where: {
          supplierId: {
            not: null,
          },
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const scoreByName = new Map<string, (typeof scores)[number]>();
    scores.forEach((score) => {
      const key = score.supplierName.trim().toLowerCase();
      if (!scoreByName.has(key)) {
        scoreByName.set(key, score);
      }
    });

    const usageMap = new Map(
      usage
        .filter((row) => row.supplierId)
        .map((row) => [row.supplierId, row._count._all]),
    );

    const rows = suppliers.map((supplier) => {
      const score = scoreByName.get(supplier.name.trim().toLowerCase());
      const quality = Number(score?.quality ?? 0);
      const delivery = Number(score?.delivery ?? 0);
      const pricing = Number(score?.pricing ?? 0);
      const overall = Number(score?.overall ?? 0);
      const classification =
        overall >= 4.5
          ? 'EXCELLENT'
          : overall >= 3.5
            ? 'GOOD'
            : overall >= 2.5
              ? 'PASS'
              : overall > 0
                ? 'WARNING'
                : 'UNRATED';

      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        status: 'ACTIVE',
        usageCount: usageMap.get(supplier.id) ?? 0,
        lastEvaluationAt: score?.updatedAt ?? null,
        quality,
        delivery,
        pricing,
        overall,
        classification,
      };
    });

    const evaluatedRows = rows.filter((row) => row.overall > 0);
    const averageOverall = evaluatedRows.length
      ? evaluatedRows.reduce((sum, row) => sum + row.overall, 0) /
        evaluatedRows.length
      : 0;

    const trend = Array.from({ length: 6 }, (_, index) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - index));
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const monthScores = scores.filter((score) => {
        const value = new Date(score.updatedAt);
        return (
          `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}` ===
          monthKey
        );
      });
      const average = monthScores.length
        ? monthScores.reduce(
            (sum, score) => sum + Number(score.overall ?? 0),
            0,
          ) / monthScores.length
        : averageOverall;
      return {
        month: `${String(month.getMonth() + 1).padStart(2, '0')}/${month.getFullYear()}`,
        average,
      };
    });

    return {
      metrics: {
        total: suppliers.length,
        evaluated: evaluatedRows.length,
        averageOverall,
        excellent: rows.filter((row) => row.classification === 'EXCELLENT')
          .length,
        good: rows.filter((row) => row.classification === 'GOOD').length,
        pass: rows.filter((row) => row.classification === 'PASS').length,
        warning: rows.filter((row) => row.classification === 'WARNING').length,
        inactive: 0,
      },
      rows,
      trend,
      recent: rows
        .filter((row) => row.lastEvaluationAt)
        .sort(
          (a, b) =>
            new Date(b.lastEvaluationAt).getTime() -
            new Date(a.lastEvaluationAt).getTime(),
        )
        .slice(0, 8),
    };
  }

  async create(payload: SupplierPayload) {
    return this.prisma.supplier.create({
      data: {
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        contact: payload.contact?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || null,
        address: payload.address?.trim() || null,
      },
    });
  }

  async update(id: string, payload: Partial<SupplierPayload>) {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        ...(payload.code != null && {
          code: payload.code.trim().toUpperCase(),
        }),
        ...(payload.name != null && {
          name: payload.name.trim(),
        }),
        ...(payload.contact !== undefined && {
          contact: payload.contact?.trim() || null,
        }),
        ...(payload.phone !== undefined && {
          phone: payload.phone?.trim() || null,
        }),
        ...(payload.email !== undefined && {
          email: payload.email?.trim() || null,
        }),
        ...(payload.address !== undefined && {
          address: payload.address?.trim() || null,
        }),
      },
    });
  }
}
