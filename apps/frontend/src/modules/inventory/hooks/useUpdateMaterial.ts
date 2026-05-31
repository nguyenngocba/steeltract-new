import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  updateMaterial,
} from '../api/endpoints/inventory.endpoint'

export function useUpdateMaterial() {

  const queryClient =
    useQueryClient()

  return useMutation({

    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: any
    }) =>
      updateMaterial(
        id,
        payload,
      ),

    onSuccess() {

      queryClient.invalidateQueries({
        queryKey: ['materials'],
      })
    },
  })
}
