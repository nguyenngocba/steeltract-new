import {
  api,
} from '../../../../lib/api'

import type {
  MasterUnit,
  SaveUomPayload,
  UomListParams,
} from '../types/uom.types'

export async function getUnitsOfMeasure(
  params?: UomListParams,
) {
  const response = await api.get<MasterUnit[]>(
    '/master-data/uom',
    {
      params,
    },
  )

  return response.data
}

export async function createUnitOfMeasure(
  payload: SaveUomPayload,
) {
  const response = await api.post<MasterUnit>(
    '/master-data/uom',
    payload,
  )

  return response.data
}

export async function updateUnitOfMeasure({
  id,
  payload,
}: {
  id: string
  payload: SaveUomPayload
}) {
  const response = await api.patch<MasterUnit>(
    `/master-data/uom/${id}`,
    payload,
  )

  return response.data
}

export async function deactivateUnitOfMeasure(id: string) {
  const response = await api.delete<MasterUnit>(
    `/master-data/uom/${id}`,
  )

  return response.data
}
