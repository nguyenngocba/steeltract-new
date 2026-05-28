import {
  Injectable,
} from '@nestjs/common'

import { MaterialRepository }
from '../repositories/material.repository'

@Injectable()
export class MaterialService {

  constructor(

    private readonly materialRepository:
      MaterialRepository,
  ) {}

  async findAll() {

    return this.materialRepository.findAll()
  }

  async create(
    body: any,
  ) {

    return this.materialRepository.create(
      body,
    )
  }

  async stockIn(
    materialId: string,
    quantity: number,
  ) {

    return this.materialRepository.stockIn(

      materialId,
      quantity,
    )
  }

  async stockOut(
    materialId: string,
    quantity: number,
  ) {

    return this.materialRepository.stockOut(

      materialId,
      quantity,
    )
  }
}
