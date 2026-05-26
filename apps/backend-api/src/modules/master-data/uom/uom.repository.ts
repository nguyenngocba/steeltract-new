import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../core/prisma/prisma.service';
import type { ListUomDto } from './dto/uom.dto';

@Injectable()
export class UomRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(query: ListUomDto) {
    const page = query.page ?? 1;
    const take = query.limit;

    return this.prisma.masterUnit.findMany({
      where: this.buildWhere(query),
      include: {
        baseUnit: true,
        _count: {
          select: {
            derivedUnits: true,
            inventoryItems: true,
          },
        },
      },
      orderBy: [
        {
          category: 'asc',
        },
        {
          code: 'asc',
        },
      ],
      skip: take ? (page - 1) * take : undefined,
      take,
    });
  }

  count(query: ListUomDto) {
    return this.prisma.masterUnit.count({
      where: this.buildWhere(query),
    });
  }

  findById(id: string) {
    return this.prisma.masterUnit.findUnique({
      where: {
        id,
      },
      include: {
        baseUnit: true,
        derivedUnits: true,
        _count: {
          select: {
            inventoryItems: true,
          },
        },
      },
    });
  }

  findByCode(code: string) {
    return this.prisma.masterUnit.findUnique({
      where: {
        code,
      },
    });
  }

  create(data: Prisma.MasterUnitCreateInput) {
    return this.prisma.masterUnit.create({
      data,
      include: {
        baseUnit: true,
        _count: {
          select: {
            derivedUnits: true,
            inventoryItems: true,
          },
        },
      },
    });
  }

  update(id: string, data: Prisma.MasterUnitUpdateInput) {
    return this.prisma.masterUnit.update({
      where: {
        id,
      },
      data,
      include: {
        baseUnit: true,
        _count: {
          select: {
            derivedUnits: true,
            inventoryItems: true,
          },
        },
      },
    });
  }

  private buildWhere(query: ListUomDto): Prisma.MasterUnitWhereInput {
    const search = (query.search || query.q)?.trim();

    return {
      category: query.category,
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
              symbol: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
