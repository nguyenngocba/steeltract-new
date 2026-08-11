import { randomBytes } from 'node:crypto'
import { chmod, writeFile } from 'node:fs/promises'

const baseUrl = process.env.RBAC2_API_URL ?? 'http://127.0.0.1:3100'
const adminUsername = process.env.RBAC2_ADMIN_USERNAME ?? 'admin'
const adminPassword = process.env.RBAC2_ADMIN_PASSWORD ?? '123456789'

type Permission = { id: string; name: string }
type Role = { id: string; name: string; permissions: Permission[] }
type User = { id: string; username: string }
type Preset = { key: string; label: string; permissions: string[] }

const assignments = [
  ['warehouse_demo', 'warehouse-operator'],
  ['planner_demo', 'production-planner'],
  ['qc_demo', 'qc-inspector'],
  ['logistics_demo', 'logistics-coordinator'],
  ['pm_demo', 'project-manager'],
  ['executive_demo', 'executive-viewer'],
] as const

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<{ status: number; data: T }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  return { status: response.status, data }
}

async function login(username: string, password: string) {
  const result = await request<{ accessToken?: string; access_token?: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  )
  const token = result.data.accessToken ?? result.data.access_token
  if (result.status !== 201 || !token) {
    throw new Error(`Login failed for ${username}: HTTP ${result.status}`)
  }
  return token
}

async function main() {
  const adminToken = await login(adminUsername, adminPassword)
  const [matrixResult, rolesResult, usersResult] = await Promise.all([
    request<{ permissions: Permission[]; presets: Preset[] }>('/system/role-matrix', {}, adminToken),
    request<Role[]>('/system/roles', {}, adminToken),
    request<User[]>('/system/users', {}, adminToken),
  ])
  if (matrixResult.status !== 200 || rolesResult.status !== 200 || usersResult.status !== 200) {
    throw new Error('Unable to read the administration catalog')
  }

  const permissionByName = new Map(matrixResult.data.permissions.map((permission) => [permission.name, permission]))
  const roles = [...rolesResult.data]
  const users = [...usersResult.data]
  const roleByPreset = new Map<string, Role>()

  for (const preset of matrixResult.data.presets) {
    if (preset.key === 'administrator') continue
    const roleName = `RBAC2 ${preset.label}`
    const permissionIds = preset.permissions.map((name) => {
      const permission = permissionByName.get(name)
      if (!permission) throw new Error(`Missing permission ${name}`)
      return permission.id
    })
    let role = roles.find((item) => item.name === roleName)
    if (!role) {
      const created = await request<Role>('/system/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleName,
          description: `SYSTEM.RBAC.2 preset: ${preset.label}`,
          permissionIds,
        }),
      }, adminToken)
      if (created.status !== 201) throw new Error(`Create role ${roleName}: HTTP ${created.status}`)
      role = created.data
      roles.push(role)
    } else {
      const updated = await request<Role>(`/system/roles/${role.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds }),
      }, adminToken)
      if (updated.status !== 200) throw new Error(`Update role ${roleName}: HTTP ${updated.status}`)
      role = updated.data
    }
    roleByPreset.set(preset.key, role)
  }

  const adminRole = roles.find((role) => role.name.toLowerCase() === 'admin')
  if (!adminRole) throw new Error('Canonical admin role not found')

  const credentials: Record<string, string> = {}
  const runtimeUsers: Array<{ username: string; preset: string; roleId: string }> = [
    ...assignments.map(([username, preset]) => ({
      username,
      preset,
      roleId: roleByPreset.get(preset)?.id ?? '',
    })),
    { username: 'admin_demo', preset: 'administrator', roleId: adminRole.id },
  ]

  for (const fixture of runtimeUsers) {
    if (!fixture.roleId) throw new Error(`Role missing for ${fixture.preset}`)
    const password = `R2!${randomBytes(12).toString('base64url')}`
    credentials[fixture.username] = password
    let user = users.find((item) => item.username === fixture.username)
    if (!user) {
      const created = await request<User>('/system/users', {
        method: 'POST',
        body: JSON.stringify({
          username: fixture.username,
          fullName: `SYSTEM.RBAC.2 ${fixture.preset}`,
          password,
          roleIds: [fixture.roleId],
        }),
      }, adminToken)
      if (created.status !== 201) throw new Error(`Create user ${fixture.username}: HTTP ${created.status}`)
      user = created.data
      users.push(user)
    } else {
      const roleUpdate = await request(`/system/users/${user.id}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds: [fixture.roleId] }),
      }, adminToken)
      const passwordUpdate = await request(`/system/users/${user.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }, adminToken)
      const statusUpdate = await request(`/system/users/${user.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'ACTIVE' }),
      }, adminToken)
      if ([roleUpdate.status, passwordUpdate.status, statusUpdate.status].some((status) => status < 200 || status >= 300)) {
        throw new Error(`Synchronize user ${fixture.username} failed`)
      }
    }
  }

  const evidence: Record<string, Record<string, number>> = {}
  evidence.anonymous = {
    inventory: (await request('/inventory/overview')).status,
  }

  const checks: Record<string, Array<[string, string, RequestInit?]>> = {
    warehouse_demo: [
      ['inventoryRead', '/inventory/overview'],
      ['productionDenied', '/production'],
      ['receiveAllowed', '/inventory/transactions', { method: 'POST', body: '{}' }],
    ],
    planner_demo: [
      ['productionRead', '/production'],
      ['qcDenied', '/qc/dashboard'],
      ['createOrderAllowed', '/production', { method: 'POST', body: '{}' }],
    ],
    qc_demo: [
      ['qcRead', '/qc/dashboard'],
      ['inventoryDenied', '/inventory/overview'],
      ['inspectAllowed', '/qc/inspections/__rbac2_missing__', { method: 'PATCH', body: '{}' }],
    ],
    logistics_demo: [
      ['logisticsRead', '/logistics/dispatch-dashboard'],
      ['inventoryDenied', '/inventory/overview'],
      ['dispatchAllowed', '/logistics/dispatch-orders', { method: 'POST', body: '{}' }],
    ],
    pm_demo: [
      ['projectsRead', '/projects'],
      ['qcDenied', '/qc/dashboard'],
      ['createProjectAllowed', '/projects', { method: 'POST', body: '{}' }],
    ],
    executive_demo: [
      ['executiveDashboard', '/dashboard/executive-cockpit'],
      ['systemDenied', '/system/users'],
    ],
    admin_demo: [
      ['systemUsers', '/system/users'],
      ['roleMatrix', '/system/role-matrix'],
    ],
  }

  for (const [username, userChecks] of Object.entries(checks)) {
    const token = await login(username, credentials[username])
    evidence[username] = {}
    for (const [label, path, options] of userChecks) {
      evidence[username][label] = (await request(path, options, token)).status
    }
  }

  const outputPath = '/tmp/system-rbac2-credentials.json'
  await writeFile(outputPath, JSON.stringify({ baseUrl, credentials, evidence }, null, 2))
  await chmod(outputPath, 0o600)
  console.log(JSON.stringify({
    permissionCount: matrixResult.data.permissions.length,
    presetCount: matrixResult.data.presets.length,
    users: runtimeUsers.map((item) => item.username),
    evidence,
    credentialFile: outputPath,
  }, null, 2))
}

void main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
