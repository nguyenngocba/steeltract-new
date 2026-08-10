import { chmod, readFile, writeFile } from 'node:fs/promises';

const envFile = process.env.RUNTIME_CREDENTIALS_FILE ?? '/tmp/steeltrack-runtime1-credentials.env';
const env = Object.fromEntries(
  (await readFile(envFile, 'utf8'))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);
const baseUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100';

async function request(path, token, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return body;
}

const login = await request('/auth/login', undefined, {
  method: 'POST',
  body: JSON.stringify({
    username: process.env.RUNTIME_ADMIN_USERNAME ?? env.RUNTIME_ADMIN_USERNAME,
    password: process.env.RUNTIME_ADMIN_PASSWORD ?? env.RUNTIME_ADMIN_PASSWORD,
  }),
});
const [dashboard, workspace] = await Promise.all([
  request('/yard/dashboard', login.accessToken),
  request('/yard/read-model/workspace', login.accessToken),
]);
const comparisons = [
  ['totalZones', dashboard.data.totalZones, workspace.summary.zones],
  ['totalSlots', dashboard.data.totalSlots, workspace.summary.totalSlots],
  ['occupiedSlots', dashboard.data.occupiedSlots, workspace.summary.occupiedSlots],
  ['availableSlots', dashboard.data.availableSlots, workspace.summary.availableSlots],
  ['activePlacementCount', dashboard.data.activePlacementCount, workspace.summary.placements],
  ['totalWeight', dashboard.data.totalWeight, workspace.summary.totalWeight],
  ['movementToday', dashboard.data.movementToday, workspace.summary.movementsToday],
  ['movementMonth', dashboard.data.movementMonth, workspace.analytics.movementMonth],
  ['overloadedZoneCount', dashboard.data.overloadedZoneCount, workspace.summary.overloadedZones],
  ['craneCount', dashboard.data.craneCount, workspace.cranes.length],
  ['availableCraneCount', dashboard.data.availableCraneCount, workspace.analytics.craneAvailableCount],
].map(([field, dashboardValue, readModelValue]) => ({
  field,
  dashboardValue: Number(dashboardValue),
  readModelValue: Number(readModelValue),
  pass: Math.abs(Number(dashboardValue) - Number(readModelValue)) <= 0.0001,
}));

const evidence = {
  generatedAt: new Date().toISOString(),
  dashboardSource: dashboard.source,
  fallbackReason: dashboard.meta?.fallbackReason ?? null,
  warnings: dashboard.meta?.warnings ?? [],
  comparisons,
  passed: comparisons.every((row) => row.pass) && !(dashboard.meta?.warnings?.length),
};
if (!evidence.passed) throw new Error(`Yard parity failed: ${JSON.stringify(evidence)}`);

const output = '/tmp/system-runtime2-yard-parity-evidence.json';
await writeFile(output, JSON.stringify(evidence, null, 2));
await chmod(output, 0o600);
console.log(JSON.stringify({ output, ...evidence }, null, 2));
