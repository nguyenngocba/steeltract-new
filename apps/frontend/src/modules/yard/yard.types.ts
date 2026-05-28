export type YardSlot = {

  id: string

  code: string
}

export type YardZone = {

  id: string

  name: string
}

export type PaginatedYardResponse<T = any> = {

  data: T[]

  total: number

  page: number

  limit: number
}
