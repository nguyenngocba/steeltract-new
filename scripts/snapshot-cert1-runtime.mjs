import { chmod, writeFile } from 'node:fs/promises';

const baseUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100';
const username = process.env.RUNTIME_ADMIN_USERNAME ?? 'admin';
const password = process.env.RUNTIME_ADMIN_PASSWORD ?? '123456789';
const outputFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-snapshot1-runtime-evidence.json';
const modules = ['ERP', 'INVENTORY', 'PRODUCTION', 'QC', 'PROJECTS', 'YARD', 'LOGISTICS', 'DISPATCH'];
const evidence = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  endpoints: [],
  checks: [],
};

function check(name, pass, details) {
  evidence.checks.push({ name, pass: Boolean(pass), details });
}

async function request(label, path, token) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const raw = await response.text();
  let body;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  evidence.endpoints.push({
    label,
    path,
    status: response.status,
    durationMs: Math.round((performance.now() - started) * 100) / 100,
  });
  return { status: response.status, body };
}

const loginResponse = await fetch(`${baseUrl}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
const login = await loginResponse.json();
const token = login.accessToken;
check('Authenticated runtime access', loginResponse.status === 201 && Boolean(token), {
  status: loginResponse.status,
});

const latest = await request('Latest enterprise snapshot', '/history/dashboard/latest', token);
check('GET /history/dashboard/latest does not return 404', latest.status === 200, {
  status: latest.status,
  message: latest.body?.message,
});

const moduleSnapshots = {};
for (const module of modules) {
  const response = await request(
    `Latest ${module} snapshot`,
    `/history/dashboard/latest?module=${module}`,
    token,
  );
  moduleSnapshots[module] = response;
  check(`${module} authoritative snapshot is available`, response.status === 200, {
    status: response.status,
    snapshotDate: response.body?.snapshotDate,
    generatedAt: response.body?.generatedAt,
    authoritative: response.body?.authoritative,
    stale: response.body?.stale,
  });
}

const livePaths = {
  inventory: '/inventory/overview',
  production: '/production/read-model/cockpit',
  qc: '/qc/dashboard',
  projects: '/projects/runtime',
  yard: '/yard/dashboard',
  logistics: '/logistics/dispatch-dashboard',
  executive: '/dashboard/executive-cockpit',
};
const live = {};
for (const [name, path] of Object.entries(livePaths)) {
  const response = await request(`Live ${name}`, path, token);
  live[name] = response.body;
  check(`Live ${name} read model responds`, response.status === 200, {
    status: response.status,
  });
}

const inventorySnapshot = moduleSnapshots.INVENTORY.body;
check(
  'Inventory live total stock equals historical snapshot',
  inventorySnapshot?.kpis?.totalStock === live.inventory?.summary?.totalStock,
  {
    live: live.inventory?.summary?.totalStock,
    snapshot: inventorySnapshot?.kpis?.totalStock,
  },
);
check(
  'Inventory live material count equals historical snapshot',
  inventorySnapshot?.kpis?.totalMaterials === live.inventory?.summary?.totalItems,
  {
    live: live.inventory?.summary?.totalItems,
    snapshot: inventorySnapshot?.kpis?.totalMaterials,
  },
);

const yardSnapshot = moduleSnapshots.YARD.body;
check(
  'Yard live active placements equal historical snapshot',
  yardSnapshot?.kpis?.activePlacements === live.yard?.data?.activePlacementCount,
  {
    live: live.yard?.data?.activePlacementCount,
    snapshot: yardSnapshot?.kpis?.activePlacements,
  },
);

const projection = await request(
  'Projection health',
  '/query-api/projections/health',
  token,
);
const projectionRows = Array.isArray(projection.body) ? projection.body : [];
const degraded = projectionRows.filter((row) => row.status === 'DEGRADED');
const notInitialized = projectionRows.filter((row) => row.status === 'NOT_INITIALIZED');
check('Projection API responds', projection.status === 200, { status: projection.status });
check('Projection workers have no active failures', degraded.length === 0, {
  degraded: degraded.map((row) => row.projectionName),
});
check('All registered projections are initialized', notInitialized.length === 0, {
  notInitialized: notInitialized.map((row) => row.projectionName),
});

const jobs = await request('Snapshot jobs', '/history/jobs?page=1&pageSize=100', token);
const jobRows = jobs.body?.data ?? [];
check('Snapshot jobs API responds', jobs.status === 200, { status: jobs.status });
check(
  'Snapshot jobs contain no failed or running records',
  !jobRows.some((row) => row.status === 'FAILED' || row.status === 'RUNNING'),
  {
    statusCounts: jobRows.reduce((result, row) => {
      result[row.status] = (result[row.status] ?? 0) + 1;
      return result;
    }, {}),
  },
);

evidence.summary = {
  status: evidence.checks.every((row) => row.pass) ? 'GO' : 'NO-GO',
  passed: evidence.checks.filter((row) => row.pass).length,
  failed: evidence.checks.filter((row) => !row.pass).length,
  moduleAvailability: Object.fromEntries(
    Object.entries(moduleSnapshots).map(([module, value]) => [module, value.status]),
  ),
  projection: {
    registered: projectionRows.length,
    healthy: projectionRows.filter((row) => row.status === 'HEALTHY').length,
    degraded: degraded.map((row) => row.projectionName),
    notInitialized: notInitialized.map((row) => row.projectionName),
  },
};

await writeFile(outputFile, JSON.stringify(evidence, null, 2));
await chmod(outputFile, 0o600);
console.log(JSON.stringify({ outputFile, ...evidence.summary, checks: evidence.checks }, null, 2));
