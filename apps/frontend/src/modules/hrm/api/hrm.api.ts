import { http } from '../../../shared/http/http-client'

export async function getEmployees() {
  const response =
    await http.get('/hrm/employees')

  return response.data
}

export async function getAttendance() {
  const response =
    await http.get('/hrm/attendance')

  return response.data
}

export async function getOperators() {
  const response =
    await http.get('/hrm/operators')

  return response.data
}
