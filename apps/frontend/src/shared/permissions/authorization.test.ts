import { describe, expect, it } from 'vitest'

import type { AuthUser } from '@/lib/auth/auth.types'

import { canAccessPath, hasPermission } from './authorization'

const user = (permissions: string[]): AuthUser => ({
  id: 'user-1',
  username: 'operator',
  roles: ['operator'],
  permissions,
})

describe('enterprise authorization policy', () => {
  it('supports legacy broad permissions during migration', () => {
    expect(hasPermission(['inventory.read'], 'inventory.view')).toBe(true)
    expect(hasPermission(['inventory.write'], 'inventory.receive')).toBe(true)
  })

  it('does not widen a view grant into an action grant', () => {
    expect(hasPermission(['inventory.view'], 'inventory.receive')).toBe(false)
    expect(hasPermission(['qc.view'], 'qc.pass')).toBe(false)
  })

  it('uses the same module policy for routes and sidebar entries', () => {
    expect(canAccessPath(user(['qc.view']), '/qc/final')).toBe(true)
    expect(canAccessPath(user(['qc.view']), '/production')).toBe(false)
    expect(canAccessPath(user(['roles.view']), '/roles')).toBe(true)
  })
})
