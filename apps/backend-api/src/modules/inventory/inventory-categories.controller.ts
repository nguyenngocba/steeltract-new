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

@Controller('inventory/categories')
export class InventoryCategoriesController {

  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  @Get()
  async getCategories() {

    return this.prisma.inventoryCategory.findMany({

      orderBy: {
        name: 'asc',
      },
    })
  }

  @Post()
  async createCategory(
    @Body() body: any,
  ) {

    return this.prisma.inventoryCategory.create({

      data: {

        code:
          body.code,

        name:
          body.name,

        description:
          body.description ??
          null,
      },
    })
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: any,
  ) {

    return this.prisma.inventoryCategory.update({

      where: {
        id,
      },

      data: {

        code:
          body.code,

        name:
          body.name,

        description:
          body.description ??
          null,
      },
    })
  }

  @Delete(':id')
  async deleteCategory(
    @Param('id') id: string,
  ) {

    return this.prisma.inventoryCategory.delete({

      where: {
        id,
      },
    })
  }
}
