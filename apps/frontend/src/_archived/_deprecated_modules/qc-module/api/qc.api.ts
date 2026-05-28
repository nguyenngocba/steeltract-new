import { http }
from '../../../shared/api/http'

export async function getIncomingQc() {

  const response = await http.get(
    '/qc/incoming',
  )

  return response.data
}

export async function getQcDefects() {

  const response = await http.get(
    '/qc/defects',
  )

  return response.data
}
