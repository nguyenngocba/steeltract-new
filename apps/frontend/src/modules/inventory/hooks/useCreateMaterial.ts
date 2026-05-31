import { useMutation }
from '@tanstack/react-query'

import { useQueryClient }
from '@tanstack/react-query'

import {
  createMaterial,
} from '../api/endpoints/inventory.endpoint'

export function useCreateMaterial() {

  const queryClient =
    useQueryClient()

  return useMutation({

    mutationFn:
      createMaterial,

    onSuccess() {

      queryClient.invalidateQueries({
        queryKey: ['materials'],
      })
    },
  })
}