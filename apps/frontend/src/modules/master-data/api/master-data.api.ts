import {
  api,
} from '../../../lib/api'

import type {
  MasterDataDomainId,
  MasterDataListParams,
  MasterDataPayload,
  MasterDataRecord,
} from '../types/master-data.types'

export async function getMasterDataRecords(
  domain: MasterDataDomainId,
  params?: MasterDataListParams,
) {
  const response = await api.get<MasterDataRecord[]>(
    `/master-data/${domain}`,
    {
      params,
    },
  )

  return response.data
}

export async function createMasterDataRecord({
  domain,
  payload,
}: {
  domain: MasterDataDomainId
  payload: MasterDataPayload
}) {
  const response = await api.post<MasterDataRecord>(
    `/master-data/${domain}`,
    payload,
  )

  return response.data
}

export async function updateMasterDataRecord({
  domain,
  id,
  payload,
}: {
  domain: MasterDataDomainId
  id: string
  payload: MasterDataPayload
}) {
  const response = await api.patch<MasterDataRecord>(
    `/master-data/${domain}/${id}`,
    payload,
  )

  return response.data
}

export async function deactivateMasterDataRecord({
  domain,
  id,
}: {
  domain: MasterDataDomainId
  id: string
}) {
  const response = await api.delete<MasterDataRecord>(
    `/master-data/${domain}/${id}`,
  )

  return response.data
}
