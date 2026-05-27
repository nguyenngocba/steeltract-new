import { http } from '../../../shared/http/http-client'

export async function getAgents() {
  const response =
    await http.get('/ai/agents')

  return response.data
}

export async function getPredictions() {
  const response =
    await http.get('/ai/predictions')

  return response.data
}

export async function inventoryForecast(
  quantity: number
) {
  const response =
    await http.post(
      '/ai/predict/inventory',
      {
        quantity,
      }
    )

  return response.data
}

export async function maintenanceForecast(
  temperature: number
) {
  const response =
    await http.post(
      '/ai/predict/maintenance',
      {
        temperature,
      }
    )

  return response.data
}
