import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common'

import { PrismaService }
  from '../../core/prisma/prisma.service'

@Controller('inventory/material-types')
export class MaterialTypesController {

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  @Get()
  async getMaterialTypes() {

    return this.prisma.materialType.findMany({
      where: {
        active: true,
      },

      include: {
        category: true,
      },

      orderBy: {
        name: 'asc',
      },
    })
  }

  @Post()
  async createMaterialType(
    @Body() body: any,
  ) {

    return this.prisma.materialType.create({

      data: {

        code:
          body.code,

        name:
          body.name,

        category: {
          connect: {
            id:
              body.categoryId,
          },
        },
        description:
          body.description ??
          null,
        color:
          body.color ??
          null,
      },
    })
  }

  @Put(':id')
  async updateMaterialType(
    @Param('id') id: string,
    @Body() body: any,
  ) {

    return this.prisma.materialType.update({

      where: {
        id,
      },

      data: {

        code:
          body.code,

        name:
          body.name,

        category: {
          connect: {
            id:
              body.categoryId,
          },
        },
        description:
          body.description ??
          null,
        active:
          body.active ??
          true,
        color:
          body.color ??
          null,
      },
    })
  }

  @Delete(':id')
  async deleteMaterialType(
    @Param('id') id: string,
  ) {

    return this.prisma.materialType.update({

      where: {
        id,
      },
      data: {
        active: false,
      },
    })
  }
}
