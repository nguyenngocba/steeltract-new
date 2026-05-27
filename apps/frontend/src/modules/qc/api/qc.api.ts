import { http } from '../../../shared/http/http-client'

export async function getInspections() {
  const response =
    await http.get('/qc/inspections')

  return response.data
}

export async function getDefects() {
  const response =
    await http.get('/qc/defects')

  return response.data
}

export async function getNcr() {
  const response =
    await http.get('/qc/ncr')

  return response.data
}
