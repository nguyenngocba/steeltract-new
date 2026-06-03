import { systemApi } from '@/modules/system/api/system.api'

export async function getRoles() {
  return systemApi.roles()
}
