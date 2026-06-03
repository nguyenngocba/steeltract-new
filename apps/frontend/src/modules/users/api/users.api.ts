import { systemApi } from '@/modules/system/api/system.api'

export async function getUsers() {
  return systemApi.users()
}
