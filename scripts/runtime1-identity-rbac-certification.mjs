import { createHmac, randomBytes } from 'node:crypto'
import { chmod, writeFile } from 'node:fs/promises'

const apiUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3000'
const adminUsername = required('RUNTIME_ADMIN_USERNAME')
const adminPassword = required('RUNTIME_ADMIN_PASSWORD')
const outputFile =
  process.env.RUNTIME_IDENTITY_EVIDENCE ?? '/tmp/runtime1-identity-evidence.json'
const credentialFile =
  process.env.RUNTIME_USER_CREDENTIALS ?? '/tmp/runtime1-user-credentials.json'
const runId = `SYSTEM-RUNTIME1-${Date.now()}`
const evidence = { runId, accounts: [], checks: [] }

const roleProfiles = [
  {
    key: 'inventory',
    name: 'Inventory',
    permissions: ['inventory.read', 'inventory.write', 'master-data.read'],
    allowed: '/inventory/overview',
    denied: '/production/read-model/cockpit?limit=1',
  },
  {
    key: 'planner',
    name: 'Production Planner',
    permissions: [
      'production.read',
      'production.write',
      'projects.read',
      'components.read',
      'inventory.read',
    ],
    allowed: '/production/read-model/cockpit?limit=1',
    denied: '/logistics/dispatch-dashboard',
  },
  {
    key: 'operator',
    name: 'Production Operator',
    permissions: [
      'production.read',
      'production.write',
      'components.read',
      'inventory.read',
    ],
    allowed: '/production/read-model/cockpit?limit=1',
    denied: '/system/users',
  },
  {
    key: 'qc',
    name: 'QC Inspector',
    permissions: ['qc.read', 'qc.write', 'components.read', 'production.read'],
    allowed: '/qc/read-model/workspace?limit=1',
    denied: '/inventory/overview',
  },
  {
    key: 'warehouse',
    name: 'Warehouse',
    permissions: [
      'inventory.read',
      'inventory.write',
      'yard.read',
      'yard.write',
      'components.read',
    ],
    allowed: '/yard/dashboard',
    denied: '/production/read-model/cockpit?limit=1',
  },
  {
    key: 'logistics',
    name: 'Logistics',
    permissions: [
      'logistics.read',
      'logistics.write',
      'yard.read',
      'projects.read',
      'components.read',
    ],
    allowed: '/logistics/dispatch-dashboard',
    denied: '/inventory/overview',
  },
  {
    key: 'project',
    name: 'Project Manager',
    permissions: [
      'projects.read',
      'projects.write',
      'project.approve',
      'components.read',
      'production.read',
      'logistics.read',
    ],
    allowed: '/projects?limit=1',
    denied: '/qc/read-model/workspace?limit=1',
  },
]

const adminLogin = await request('Admin login', '/auth/login', {
  method: 'POST',
  body: { username: adminUsername, password: adminPassword },
  expected: 201,
})
let adminToken = adminLogin.body.accessToken ?? adminLogin.body.access_token
const adminRefresh = adminLogin.body.refreshToken ?? adminLogin.body.refresh_token

await request('No-token mutation', '/inventory/transactions', {
  method: 'POST',
  body: {},
  expected: 401,
})

const permissionsResponse = await request('Permission catalog', '/system/permissions', {
  token: adminToken,
  expected: 200,
})
const permissionByName = new Map(
  permissionsResponse.body.map((permission) => [permission.name, permission.id]),
)
const existingRoles = await request('Existing roles', '/system/roles', {
  token: adminToken,
  expected: 200,
})
const existingUsers = await request('Existing users', '/system/users', {
  token: adminToken,
  expected: 200,
})
for (const user of existingUsers.body) {
  if (user.username.startsWith('runtime1_') && user.status === 'ACTIVE') {
    await request(`Disable stale fixture ${user.username}`, `/system/users/${user.id}/status`, {
      method: 'POST',
      token: adminToken,
      body: { status: 'BLOCKED' },
      expected: 201,
    })
  }
}

const credentials = {
  runId,
  accounts: {
    administrator: { username: adminUsername, password: adminPassword },
  },
}

for (const profile of roleProfiles) {
  const roleName = `RUNTIME1 ${profile.name}`
  const permissionIds = profile.permissions.map((name) => {
    const id = permissionByName.get(name)
    if (!id) throw new Error(`Canonical permission not found: ${name}`)
    return id
  })
  let role = existingRoles.body.find((item) => item.name === roleName)
  if (role) {
    const replaced = await request(
      `Replace ${profile.key} permissions`,
      `/system/roles/${role.id}/permissions`,
      { method: 'PUT', token: adminToken, body: { permissionIds }, expected: 200 },
    )
    role = replaced.body
  } else {
    const created = await request(`Create ${profile.key} role`, '/system/roles', {
      method: 'POST',
      token: adminToken,
      body: {
        name: roleName,
        description: `SYSTEM.RUNTIME.1 ${profile.name} fixture role`,
        permissionIds,
      },
      expected: 201,
    })
    role = created.body
  }

  const username = `runtime1_${profile.key}_${Date.now()}`
  const password = strongPassword()
  const userResponse = await request(`Create ${profile.key} user`, '/system/users', {
    method: 'POST',
    token: adminToken,
    body: {
      username,
      email: `${username}@runtime.steeltrack.local`,
      fullName: `${profile.name} Runtime Certification`,
      password,
      roleIds: [role.id],
    },
    expected: 201,
  })
  const user = userResponse.body
  const login = await request(`Login ${profile.key}`, '/auth/login', {
    method: 'POST',
    body: { username, password },
    expected: 201,
  })
  const token = login.body.accessToken ?? login.body.access_token
  await request(`${profile.key} allowed`, profile.allowed, {
    token,
    expected: 200,
  })
  await request(`${profile.key} denied`, profile.denied, {
    token,
    expected: 403,
  })

  credentials.accounts[profile.key] = { username, password }
  evidence.accounts.push({
    id: user.id,
    username,
    role: role.name,
    permissions: profile.permissions,
  })
}

const refreshed = await request('Refresh token rotation', '/auth/refresh', {
  method: 'POST',
  body: { refreshToken: adminRefresh },
  expected: 201,
})
adminToken = refreshed.body.accessToken ?? refreshed.body.access_token
await request('Reject reused refresh token', '/auth/refresh', {
  method: 'POST',
  body: { refreshToken: adminRefresh },
  expected: 401,
})
await request('Refreshed access token works', '/auth/me', {
  token: adminToken,
  expected: 200,
})

const warehouse = evidence.accounts.find((account) => account.role.endsWith('Warehouse'))
await request('Disable warehouse user', `/system/users/${warehouse.id}/status`, {
  method: 'POST',
  token: adminToken,
  body: { status: 'BLOCKED' },
  expected: 201,
})
await request('Disabled user rejected', '/auth/login', {
  method: 'POST',
  body: credentials.accounts.warehouse,
  expected: 401,
})
await request('Re-enable warehouse user', `/system/users/${warehouse.id}/status`, {
  method: 'POST',
  token: adminToken,
  body: { status: 'ACTIVE' },
  expected: 201,
})

const expiredToken = signExpiredAccessToken({
  sub: adminLogin.body.user.id,
  username: adminUsername,
  roles: ['admin'],
  permissions: adminLogin.body.user.permissions,
})
await request('Expired JWT rejected', '/auth/me', {
  token: expiredToken,
  expected: 401,
})

await writeRestrictedJson(credentialFile, credentials)
await writeRestrictedJson(outputFile, evidence)
console.log(
  JSON.stringify(
    {
      runId,
      accountCount: evidence.accounts.length + 1,
      checks: evidence.checks.length,
      failures: evidence.checks.filter((check) => !check.pass).length,
      credentialFile,
      outputFile,
    },
    null,
    2,
  ),
)

async function request(name, path, options = {}) {
  const startedAt = performance.now()
  const headers = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const text = await response.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  const check = {
    name,
    method: options.method ?? 'GET',
    path,
    status: response.status,
    expected: options.expected,
    durationMs: Math.round(performance.now() - startedAt),
    pass: response.status === options.expected,
  }
  evidence.checks.push(check)
  if (!check.pass) {
    throw new Error(`${name}: expected ${options.expected}, received ${response.status}: ${text}`)
  }
  return { status: response.status, body }
}

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function strongPassword() {
  return `${randomBytes(24).toString('base64url')}!Aa7`
}

function signExpiredAccessToken(payload) {
  const secret = required('JWT_SECRET')
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const encoded = [
    base64Url(header),
    base64Url({ ...payload, iat: now - 120, exp: now - 60 }),
  ].join('.')
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

async function writeRestrictedJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  await chmod(path, 0o600)
}
