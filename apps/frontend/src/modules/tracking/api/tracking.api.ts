import { http } from '../../../shared/http/http-client'

export async function getTags() {
  const response =
    await http.get('/tracking/tags')

  return response.data
}

export async function getTrackingHistory() {
  const response =
    await http.get('/tracking/history')

  return response.data
}

export async function generateQr(
  tagCode: string
) {
  const response =
    await http.post(
      '/tracking/generate-qr',
      {
        tagCode,
      }
    )

  return response.data
}
