import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../../core/prisma/prisma.service'

type SupplierPayload = {
  code: string
  name: string
  contact?: string
  phone?: string
  email?: string
  address?: string
}

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async list(search?: string) {
    const keyword = search?.trim()

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
    })
  }

  async getById(id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
    })
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
    })
  }

  async update(
    id: string,
    payload: Partial<SupplierPayload>,
  ) {
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
    })
  }
}
