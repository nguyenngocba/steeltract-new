import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  createMaterialType,
} from '../api/material-types.api'

export function useCreateMaterialType() {

  const queryClient =
    useQueryClient()

  return useMutation({

    mutationFn:
      createMaterialType,

    onSuccess() {

      queryClient.invalidateQueries({

        queryKey: [
          'inventory-material-types',
        ],
      })
    },
  })
}