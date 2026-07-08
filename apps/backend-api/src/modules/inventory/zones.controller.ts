import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { InventoryRepository } from './inventory.repository'
import { InventoryReadModelService } from './inventory-read-model.service'

type ZonePayload = {
  code?: string
  name?: string
  description?: string
  color?: string
  row?: string
  column?: string
  level?: string
  capacity?: number | string
  active?: boolean
  warehouseId?: string
}

type OccupancyItem = {
  id: string
  code: string
  name: string
  quantity: Prisma.Decimal | number | string | null
  unit?: string | null
  slotId?: string | null
  level?: string | null
}

const normalizeText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || null
}

const normalizeInternalSlot = (slotId?: string | null, level?: string | null) => {
  const rawSlot = String(slotId ?? '').trim()
  const [cellFromCombined, levelFromCombined] = rawSlot.includes(':') ? rawSlot.split(':') : ['', '']
  const cell = (rawSlot.includes(':') ? cellFromCombined : rawSlot).trim()
  const normalizedLevel = String(level ?? levelFromCombined ?? '').trim() || 'L1'

  if (!cell) return null

  return {
    slotId: cell.toUpperCase(),
    level: normalizedLevel.toUpperCase(),
  }
}

const buildCellOccupancy = (items: OccupancyItem[], includeMaterials = false) => {
  const occupancy = new Map<
    string,
    {
      key: string
      slotId: string
      level: string
      materialCount: number
      totalQuantity: number
      materialIds: string[]
      materials?: Array<{
        id: string
        code: string
        name: string
        quantity: number
        unit?: string | null
      }>
    }
  >()

  items.forEach((item) => {
    const location = normalizeInternalSlot(item.slotId, item.level)
    if (!location) return

    const key = `${location.slotId}:${location.level}`
    const current = occupancy.get(key) ?? {
      key,
      slotId: location.slotId,
      level: location.level,
      materialCount: 0,
      totalQuantity: 0,
      materialIds: [],
      materials: includeMaterials ? [] : undefined,
    }

    current.materialCount += 1
    current.totalQuantity += Number(item.quantity ?? 0)
    current.materialIds.push(item.id)
    current.materials?.push({
      id: item.id,
      code: item.code,
      name: item.name,
      quantity: Number(item.quantity ?? 0),
      unit: item.unit,
    })
    occupancy.set(key, current)
  })

  return Array.from(occupancy.values()).sort((a, b) => a.key.localeCompare(b.key))
}

@Controller('inventory/zones')
export class ZonesController {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly readModel: InventoryReadModelService,
  ) {}

  @Get()
  async getZones() {
    return this.readModel.locations()
  }
  
  @Get(':id')
  async getZone(@Param('id') id: string) {
    const zones = await this.readModel.locations()
    return zones.find((zone) => zone.id === id) ?? null
  }

  @Post()
  async createZone(@Body() body: ZonePayload) {
    return this.inventoryRepository.createZone(this.toCreateZoneData(body))
  }

  @Put(':id')
  async updateZone(@Param('id') id: string, @Body() body: ZonePayload) {
    return this.inventoryRepository.updateZone(id, this.toUpdateZoneData(body))
  }

  @Patch(':id/activate')
  async activateZone(@Param('id') id: string) {
    return this.inventoryRepository.updateZone(id, { active: true })
  }

  @Patch(':id/deactivate')
  async deactivateZone(@Param('id') id: string) {
    return this.inventoryRepository.updateZone(id, { active: false })
  }

  @Delete(':id')
  async deleteZone(@Param('id') id: string) {
    return this.inventoryRepository.updateZone(id, { active: false })
  }

  private toCreateZoneData(body: ZonePayload): Prisma.WarehouseZoneUncheckedCreateInput {
    return {
      code: String(body.code ?? '').trim().toUpperCase(),
      name: String(body.name ?? '').trim(),
      description: normalizeText(body.description),
      color: normalizeText(body.color) ?? '#06b6d4',
      row: normalizeText(body.row),
      column: normalizeText(body.column),
      level: normalizeText(body.level),
      capacity: Number(body.capacity) || 0,
      active: body.active ?? true,
      warehouseId: normalizeText(body.warehouseId),
    }
  }

  private toUpdateZoneData(body: ZonePayload): Prisma.WarehouseZoneUncheckedUpdateInput {
    const data: Prisma.WarehouseZoneUncheckedUpdateInput = {}

    if (body.code !== undefined) data.code = String(body.code ?? '').trim().toUpperCase()
    if (body.name !== undefined) data.name = String(body.name ?? '').trim()
    if (body.description !== undefined) data.description = normalizeText(body.description)
    if (body.color !== undefined) data.color = normalizeText(body.color) ?? '#06b6d4'
    if (body.row !== undefined) data.row = normalizeText(body.row)
    if (body.column !== undefined) data.column = normalizeText(body.column)
    if (body.level !== undefined) data.level = normalizeText(body.level)
    if (body.capacity !== undefined) data.capacity = Number(body.capacity) || 0
    if (body.active !== undefined) data.active = Boolean(body.active)
    if (body.warehouseId !== undefined) data.warehouseId = normalizeText(body.warehouseId)

    return data
  }
}
