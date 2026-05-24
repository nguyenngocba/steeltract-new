import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../core/prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findItems(params: { search?: string; skip?: number; take?: number }) {
    const where = this.buildItemWhere(params.search);

    return this.prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        zone: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  countItems(search?: string) {
    return this.prisma.inventoryItem.count({
      where: this.buildItemWhere(search),
    });
  }

  findItemById(id: string, db: DbClient = this.prisma) {
    return db.inventoryItem.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        zone: true,
      },
    });
  }

  findCategoryById(id: string, db: DbClient = this.prisma) {
    return db.inventoryCategory.findUnique({
      where: {
        id,
      },
    });
  }

  findCategoryByCodeOrName(value: string, db: DbClient = this.prisma) {
    return db.inventoryCategory.findFirst({
      where: {
        OR: [
          {
            code: {
              equals: value,
              mode: 'insensitive',
            },
          },
          {
            name: {
              equals: value,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
  }

  createItem(
    data: Prisma.InventoryItemCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.create({
      data,
      include: {
        category: true,
        zone: true,
      },
    });
  }

  updateItemInfo(
    id: string,
    data: Prisma.InventoryItemUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data,
      include: {
        category: true,
        zone: true,
      },
    });
  }

  deleteItem(id: string, db: DbClient = this.prisma) {
    return db.inventoryItem.delete({
      where: {
        id,
      },
    });
  }

  createTransaction(
    data: Prisma.InventoryTransactionCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryTransaction.create({
      data,
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });
  }

  listTransactions(params: { skip?: number; take?: number }) {
    return this.prisma.inventoryTransaction.findMany({
      include: {
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: params.skip,
      take: params.take,
    });
  }

  updateItemQuantitySnapshot(
    id: string,
    delta: number,
    db: DbClient = this.prisma,
  ) {
    return db.inventoryItem.update({
      where: {
        id,
      },
      data: {
        quantity: {
          increment: delta,
        },
      },
    });
  }

  createActivityLog(
    data: Prisma.ActivityLogCreateInput,
    db: DbClient = this.prisma,
  ) {
    return db.activityLog.create({
      data,
    });
  }

  private buildItemWhere(search?: string): Prisma.InventoryItemWhereInput {
    const value = search?.trim();

    if (!value) return {};

    return {
      OR: [
        {
          code: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: value,
            mode: 'insensitive',
          },
        },
        {
          category: {
            name: {
              contains: value,
              mode: 'insensitive',
            },
          },
        },
      ],
    };
  }
}
