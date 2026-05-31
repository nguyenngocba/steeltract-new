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
      },
    })
  }

  @Delete(':id')
  async deleteMaterialType(
    @Param('id') id: string,
  ) {

    return this.prisma.materialType.delete({

      where: {
        id,
      },
    })
  }
}
