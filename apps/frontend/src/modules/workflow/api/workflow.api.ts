import { http } from '../../../shared/http/http-client'

export async function getWorkflows() {
  const response =
    await http.get('/workflow/definitions')

  return response.data
}

export async function getApprovals() {
  const response =
    await http.get('/workflow/approvals')

  return response.data
}

export async function getRules() {
  const response =
    await http.get('/workflow/rules')

  return response.data
}
