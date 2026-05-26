import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  dictionaryPayloadSchema,
  listDictionarySchema,
  updateDictionaryPayloadSchema,
} from './dto/dictionary.dto';
import type {
  DictionaryPayloadDto,
  ListDictionaryDto,
  UpdateDictionaryPayloadDto,
} from './dto/dictionary.dto';
import { DictionariesService } from './dictionaries.service';

@UseGuards(JwtAuthGuard)
@Controller('master-data')
export class DictionariesController {
  constructor(
    private readonly dictionariesService: DictionariesService,
  ) {}

  @Get('domains')
  domains() {
    return this.dictionariesService.listDomains();
  }

  @Get(':domain')
  findAll(
    @Param('domain') domain: string,
    @Query(new ZodValidationPipe(listDictionarySchema))
    query: ListDictionaryDto,
  ) {
    return this.dictionariesService.findAll(domain, query);
  }

  @Post(':domain')
  create(
    @Param('domain') domain: string,
    @Body(new ZodValidationPipe(dictionaryPayloadSchema))
    body: DictionaryPayloadDto,
  ) {
    return this.dictionariesService.create(domain, body);
  }

  @Patch(':domain/:id')
  update(
    @Param('domain') domain: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDictionaryPayloadSchema))
    body: UpdateDictionaryPayloadDto,
  ) {
    return this.dictionariesService.update(domain, id, body);
  }

  @Delete(':domain/:id')
  deactivate(
    @Param('domain') domain: string,
    @Param('id') id: string,
  ) {
    return this.dictionariesService.deactivate(domain, id);
  }
}
