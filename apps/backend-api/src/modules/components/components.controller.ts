import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'

import { PrismaService } from '../../core/prisma/prisma.service'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'

import { FileInterceptor } from '@nestjs/platform-express'

import { diskStorage } from 'multer'

import { extname } from 'path'

import { EventsGateway } from '../../core/ws/events.gateway'

@Controller('components')
export class ComponentsController {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    return this.prisma.component.findMany({
      include: {
        project: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.prisma.component.findUnique({
      where: {
        id,
      },

      include: {
        project: true,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/timeline')
  async timeline(
    @Param('id') id: string,
  ) {
    return this.prisma.componentTimeline.findMany({
      where: {
        componentId: id,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: any,
  ) {
    return this.prisma.component.create({
      data: {
        code:
          body.code,

        name:
          body.name,

        description:
          body.description,

        floor:
          body.floor,

        zone:
          body.zone,

        position:
          body.position,

        status:
          body.status,

        installedDate:
          body.status ===
          'INSTALLED'
            ? new Date()
            : undefined,

        imageUrl:
          body.imageUrl,

        projectId:
          body.projectId,

        x:
          body.x !== undefined
            ? Number(body.x)
            : 0,

        y:
          body.y !== undefined
            ? Number(body.y)
            : 0,
      },
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination:
          './uploads/components',

        filename: (
          req,
          file,
          callback,
        ) => {
          const unique =
            Date.now() +
            '-' +
            Math.round(
              Math.random() *
                1e9,
            )

          callback(
            null,
            unique +
              extname(
                file.originalname,
              ),
          )
        },
      }),
    }),
  )
  uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return {
      imageUrl:
        '/uploads/components/' +
        file.filename,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('timeline-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination:
          './uploads/timeline',

        filename: (
          req,
          file,
          callback,
        ) => {
          const unique =
            Date.now() +
            '-' +
            Math.round(
              Math.random() *
                1e9,
            )

          callback(
            null,
            unique +
              extname(
                file.originalname,
              ),
          )
        },
      }),
    }),
  )
  uploadTimelineFile(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return {
      photoUrl:
        '/uploads/timeline/' +
        file.filename,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const component =
      await this.prisma.component.update({
        where: {
          id,
        },

        data: {
          code:
            body.code !== undefined
              ? body.code
              : undefined,

          name:
            body.name !== undefined
              ? body.name
              : undefined,

          description:
            body.description !== undefined
              ? body.description
              : undefined,

          floor:
            body.floor !== undefined
              ? body.floor
              : undefined,

          zone:
            body.zone !== undefined
              ? body.zone
              : undefined,

          position:
            body.position !== undefined
              ? body.position
              : undefined,

          status:
            body.status !== undefined
              ? body.status
              : undefined,

          installedDate:
            body.status ===
            'INSTALLED'
              ? new Date()
              : undefined,

          imageUrl:
            body.imageUrl !== undefined
              ? body.imageUrl
              : undefined,

          projectId:
            body.projectId !== undefined
              ? body.projectId
              : undefined,

          x:
            body.x !== undefined
              ? Number(body.x)
              : undefined,

          y:
            body.y !== undefined
              ? Number(body.y)
              : undefined,
        },
      })

    await this.prisma.componentTimeline.create({
      data: {
        componentId: id,

        action:
          body.status ||
          'UPDATED',

        note:
          body.note ||
          null,

        photoUrl:
          body.photoUrl ||
          null,
      },
    })

    this.events.emitEvent(
      'component.updated',
      {
        id:
          component.id,

        code:
          component.code,

        status:
          component.status,
      },
    )

    return component
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.prisma.component.delete({
      where: {
        id,
      },
    })
  }
}