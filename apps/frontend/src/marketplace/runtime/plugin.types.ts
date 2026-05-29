export type RuntimePlugin = {
  id: string

  name: string

  version: string

  author: string

  status:
    | 'ACTIVE'
    | 'DISABLED'

  description: string
}
