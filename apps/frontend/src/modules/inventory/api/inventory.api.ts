import axios from 'axios'

import { setupAuthInterceptor }
  from '../../../lib/auth/auth-interceptor'

export const inventoryApi =
  axios.create({
    baseURL:
      'http://172.168.53.116:3000',
  })

setupAuthInterceptor(
  inventoryApi,
  'http://172.168.53.116:3000',
)

export async function getInventoryItems() {
  const { data } =
    await inventoryApi.get(
      '/inventory/items',
    )

  return data
}