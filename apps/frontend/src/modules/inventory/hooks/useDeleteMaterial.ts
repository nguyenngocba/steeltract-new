import { useMutation }
from '@tanstack/react-query'

import { useQueryClient }
from '@tanstack/react-query'

import {
  deleteMaterial,
} from '../api/endpoints/inventory.endpoint'

export function useDeleteMaterial() {

  const queryClient =
    useQueryClient()

  return useMutation({

    mutationFn:
      deleteMaterial,

    onSuccess() {

      queryClient.invalidateQueries({
        queryKey: ['materials'],
      })
    },
  })
}
