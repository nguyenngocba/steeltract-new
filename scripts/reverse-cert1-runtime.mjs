import { execFile } from 'node:child_process';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const baseUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100';
const username = process.env.RUNTIME_ADMIN_USERNAME ?? 'admin';
const password = process.env.RUNTIME_ADMIN_PASSWORD ?? '123456789';
const evidenceFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-reverse-cert1-runtime-evidence.json';
const runId = `SYSTEM-REVERSE-CERT1-${Date.now()}`;
const evidence = { runId, baseUrl, startedAt: new Date().toISOString(), steps: [], assertions: [], fixtures: {} };

function assert(condition, message, details) {
  evidence.assertions.push({ pass: Boolean(condition), message, details });
  if (!condition) throw new Error(`${message}: ${JSON.stringify(details)}`);
}

async function request(label, method, path, { token, body, headers = {}, expected = [200, 201] } = {}) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let responseBody;
  try { responseBody = raw ? JSON.parse(raw) : null; } catch { responseBody = raw; }
  evidence.steps.push({ label, method, path, status: response.status, durationMs: Math.round((performance.now() - started) * 100) / 100, response: responseBody });
  if (!expected.includes(response.status)) throw new Error(`${label} returned ${response.status}: ${raw.slice(0, 1200)}`);
  return responseBody;
}

function dataOf(value) {
  if (Array.isArray(value)) return value;
  return value?.data ?? value?.items ?? [];
}

async function runForwardFixture(name, includeReverse, procurement = false) {
  const path = `/tmp/${runId}-${name}.json`;
  await execFileAsync(process.execPath, ['scripts/runtime1-business-certification.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      RUNTIME_API_URL: baseUrl,
      RUNTIME_ADMIN_USERNAME: username,
      RUNTIME_ADMIN_PASSWORD: password,
      RUNTIME_RUN_PREFIX: `${runId}-${name}`,
      RUNTIME_INCLUDE_REVERSE: String(includeReverse),
      RUNTIME_USE_PROCUREMENT: String(procurement),
      RUNTIME_CONSUMED_MATERIAL_QTY: includeReverse && procurement ? '4' : '5',
      RUNTIME_CANONICAL_MATERIAL_RETURN_QTY: includeReverse && procurement ? '1' : '0',
      RUNTIME_EVIDENCE_FILE: path,
    },
    timeout: 480_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const fixture = JSON.parse(await readFile(path, 'utf8'));
  assert(fixture.summary.failedAssertions === 0, `${name} forward fixture has no failed assertion`, fixture.summary);
  evidence.fixtures[name] = fixture;
  return fixture;
}

async function availableSlot(token, suffix) {
  let slots = dataOf(await request(`${suffix}: read available Yard slots`, 'GET', '/yard/slots?status=AVAILABLE&limit=200', { token }));
  if (slots.length) return slots[0];
  const zones = dataOf(await request(`${suffix}: read active Yard zones`, 'GET', '/yard/zones?status=ACTIVE&limit=100', { token }));
  assert(Boolean(zones[0]?.id), `${suffix}: active Yard zone exists`);
  return request(`${suffix}: create Yard slot`, 'POST', `/yard/zones/${zones[0].id}/slots`, {
    token,
    body: { code: `${runId}-${suffix}`, status: 'AVAILABLE', x: Date.now() % 100000, y: Math.floor(Date.now() / 10) % 100000, width: 1, height: 1, maxStackLevel: 1, metadata: { fixture: runId } },
  });
}

async function readInstance(token, fixture) {
  const rows = dataOf(await request('Read physical instance', 'GET', `/components/foundation/instances?productionOrderId=${fixture.summary.ids.productionOrderId}&limit=100`, { token }));
  const instance = rows.find((row) => row.id === fixture.summary.ids.componentInstanceId);
  assert(Boolean(instance), 'Fixture ComponentInstance remains addressable', fixture.summary.ids);
  return instance;
}

async function returnProjectInstance(token, fixture, suffix) {
  const slot = await availableSlot(token, `${suffix}-RETURN`);
  await request(`${suffix}: Project return to Yard quarantine`, 'POST', `/projects/${fixture.summary.ids.projectId}/component-instances/${fixture.summary.ids.componentInstanceId}/return-to-yard`, {
    token,
    body: { slotId: slot.id, reason: `${runId} ${suffix} project return` },
  });
  const instance = await readInstance(token, fixture);
  assert(instance.state === 'PRODUCED_WAITING_QC', `${suffix}: returned instance waits for FINAL QC`, { state: instance.state });
  assert(instance.installedAt == null, `${suffix}: active installation timestamp is cleared after physical return`, { installedAt: instance.installedAt });
  return slot;
}

async function createChecklist(token) {
  return request('Create reverse certification FINAL checklist', 'POST', '/qc/checklists', {
    token,
    body: {
      code: `${runId}-FINAL`, name: `${runId} Return Inspection`, type: 'FINAL', revision: 'A',
      description: 'Canonical returned ComponentInstance certification', isActive: true,
      items: [{ sequence: 1, title: 'Returned component physical acceptance', required: true }],
      metadata: { fixture: runId },
    },
  });
}

async function inspect(token, fixture, checklist, suffix, result) {
  let inspection = await request(`${suffix}: create FINAL inspection`, 'POST', '/qc/inspections', {
    token,
    body: {
      inspectionNo: `${runId}-${suffix}`, checklistId: checklist.id,
      productionOrderId: fixture.summary.ids.productionOrderId,
      componentInstanceId: fixture.summary.ids.componentInstanceId,
      projectId: fixture.summary.ids.projectId, status: 'READY', metadata: { fixture: runId, scenario: suffix },
    },
  });
  inspection = await request(`${suffix}: start FINAL inspection`, 'POST', `/qc/inspections/${inspection.id}/start`, { token, body: {} });
  await request(`${suffix}: record checklist ${result}`, 'POST', `/qc/inspections/${inspection.id}/results`, {
    token,
    body: { checklistItemId: checklist.items[0].id, category: 'FINAL', status: result, notes: `${runId} ${suffix}` },
  });
  return request(`${suffix}: read inspection`, 'GET', `/qc/inspections/${inspection.id}`, { token });
}

async function pass(token, fixture, checklist, suffix) {
  const inspection = await inspect(token, fixture, checklist, suffix, 'PASS');
  await request(`${suffix}: canonical PASS`, 'POST', `/qc/commands/inspections/${inspection.id}/pass`, {
    token, headers: { 'Idempotency-Key': `${runId}:${suffix}:pass` },
    body: { expectedVersion: Number(inspection.metadata?.aggregateVersion ?? 0), notes: `${runId} ${suffix}` },
  });
  return inspection;
}

async function failWithNcr(token, fixture, checklist, suffix) {
  const inspection = await inspect(token, fixture, checklist, suffix, 'FAIL');
  const failed = await request(`${suffix}: canonical FAIL`, 'POST', `/qc/commands/inspections/${inspection.id}/fail`, {
    token, headers: { 'Idempotency-Key': `${runId}:${suffix}:fail` },
    body: { expectedVersion: Number(inspection.metadata?.aggregateVersion ?? 0), notes: `${runId} ${suffix}` },
  });
  const ncr = await request(`${suffix}: create NCR`, 'POST', `/qc/commands/inspections/${inspection.id}/ncr`, {
    token, headers: { 'Idempotency-Key': `${runId}:${suffix}:ncr` },
    body: { expectedVersion: Number(failed.metadata?.aggregateVersion ?? 1), title: `${runId} ${suffix}`, description: 'Returned component certification defect', severity: 'HIGH', defectCode: `${suffix}_DEFECT`, reasonCode: 'RETURN_CERTIFICATION' },
  });
  return { inspection: failed, ncr };
}

async function stageAfterQc(token, fixture, suffix) {
  const instance = await readInstance(token, fixture);
  if (instance.state === 'IN_YARD') return null;
  const slot = await availableSlot(token, `${suffix}-STAGE`);
  return request(`${suffix}: stage after QC`, 'POST', '/yard/stage', {
    token, body: { componentInstanceId: instance.id, slotId: slot.id, reason: `${runId} ${suffix}` },
  });
}

const login = await request('Login administrator', 'POST', '/auth/login', { body: { username, password } });
const token = login.accessToken;
assert(Boolean(token), 'Administrator receives real JWT');

const baseline = {
  inventory: await request('Baseline Inventory', 'GET', '/inventory/overview', { token }),
  qc: await request('Baseline QC', 'GET', '/qc/read-model/workspace', { token }),
  yard: await request('Baseline Yard', 'GET', '/yard/dashboard', { token }),
  logistics: await request('Baseline Logistics', 'GET', '/logistics/dispatch-dashboard', { token }),
};

const passFixture = await runForwardFixture('PASS', true, true);
const reworkFixture = await runForwardFixture('REWORK', false, false);
const scrapFixture = await runForwardFixture('SCRAP', false, false);
const checklist = await createChecklist(token);

assert((await readInstance(token, passFixture)).state === 'PRODUCED_WAITING_QC', 'Reverse Logistics receives installed instance into Yard quarantine');
await pass(token, passFixture, checklist, 'RETURN_PASS');
assert((await readInstance(token, passFixture)).state === 'IN_YARD', 'Returned PASS instance is released in Yard');
const passSuggestion = await request('PASS: read Dispatch-ready suggestion', 'POST', '/logistics/dispatch-orders/suggest', { token, body: { projectId: passFixture.summary.ids.projectId } });
assert(dataOf(passSuggestion).some((row) => row.componentInstanceId === passFixture.summary.ids.componentInstanceId), 'Returned PASS instance is Dispatch ready');

await returnProjectInstance(token, reworkFixture, 'REWORK');
const reworkFailure = await failWithNcr(token, reworkFixture, checklist, 'RETURN_REWORK_FAIL');
await request('REWORK: disposition', 'POST', `/qc/commands/ncr/${reworkFailure.ncr.id}/rework`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:disposition` },
  body: { expectedVersion: Number(reworkFailure.ncr.metadata?.aggregateVersion ?? 1), reason: 'Returned component requires certified repair', approvedQuantity: 1, unit: 'PCS' },
});
assert((await readInstance(token, reworkFixture)).state === 'REWORK', 'Returned instance enters REWORK without replacement instance');
let originalOrder = await request('REWORK: read original Production Order', 'GET', `/production/${reworkFixture.summary.ids.productionOrderId}`, { token });
const reworkRequestId = `${runId}-REWORK-REQUEST`;
const productionRework = await request('REWORK: accept Production rework', 'POST', '/production/commands/rework/accept', {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:accept` },
  body: {
    reworkRequestId, qcNcrId: reworkFailure.ncr.id,
    originalProductionOrderId: originalOrder.id, expectedVersion: originalOrder.aggregateVersion,
    orderNo: `${runId}-REWORK-PO`, title: `${runId} Return Rework`, reason: 'Repair returned physical component',
    routingScope: { componentInstanceId: reworkFixture.summary.ids.componentInstanceId },
    engineeringBasis: reworkFixture.summary.engineeringBasis,
  },
});
let reworkOrder = await request('REWORK: read rework order', 'GET', `/production/${productionRework.reworkProductionOrderId}`, { token });
reworkOrder = await request('REWORK: release order', 'POST', `/production/commands/orders/${reworkOrder.id}/release`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:release` },
  body: { expectedVersion: reworkOrder.aggregateVersion, workOrders: [{ routingOperationId: '1', productCode: reworkFixture.summary.labels.componentCode, quantity: 1, sequence: 1 }] },
});
reworkOrder = await request('REWORK: ready order', 'POST', `/production/commands/orders/${reworkOrder.id}/ready`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:ready` },
  body: { expectedVersion: reworkOrder.aggregateVersion, routingGatePassed: true, materialGatePassed: true, blockingGatePassed: true },
});
reworkOrder = await request('REWORK: start order', 'POST', `/production/commands/orders/${reworkOrder.id}/start`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:start` }, body: { expectedVersion: reworkOrder.aggregateVersion, volatileGatesPassed: true },
});
const reworkWorkOrder = reworkOrder.workOrders[0];
const reworkCockpit = await request('REWORK: read execution', 'GET', `/production/read-model/cockpit?search=${encodeURIComponent(reworkOrder.orderNo)}&limit=10`, { token });
const reworkLog = dataOf(reworkCockpit)[0]?.logs?.find((row) => row.message === 'production.execution.started');
const reworkExecution = { id: reworkLog?.metadata?.aggregateId, aggregateVersion: reworkLog?.metadata?.aggregateVersion };
assert(Boolean(reworkExecution.id), 'Rework execution exists');
const assignments = await request('REWORK: assign same instance', 'POST', '/production/commands/instance-executions/assign', {
  token, body: { productionExecutionId: reworkExecution.id, componentInstanceIds: [reworkFixture.summary.ids.componentInstanceId] },
});
let assignment = await request('REWORK: start instance execution', 'POST', `/production/commands/instance-executions/${assignments[0].id}/start`, { token, body: {} });
assignment = await request('REWORK: complete instance execution', 'POST', `/production/commands/instance-executions/${assignment.id}/complete`, { token, body: {} });
await request('REWORK: complete execution', 'POST', `/production/commands/executions/${reworkExecution.id}/complete`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:execution-complete` },
  body: { productionOrderId: reworkOrder.id, workOrderId: reworkWorkOrder.id, expectedVersion: reworkExecution.aggregateVersion },
});
await request('REWORK: complete Work Order', 'POST', `/production/commands/work-orders/${reworkWorkOrder.id}/complete`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:work-order-complete` },
  body: { productionOrderId: reworkOrder.id, expectedVersion: reworkWorkOrder.aggregateVersion },
});
await request('REWORK: record completion', 'POST', '/production/commands/completions', {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:completion` },
  body: { productionOrderId: reworkOrder.id, expectedVersion: reworkOrder.aggregateVersion, workOrderId: reworkWorkOrder.id, executionRunId: reworkExecution.id, quantity: 1, unit: 'PCS', completedQty: 1, rejectedQty: 0, scrapQty: 0, remainingQty: 0, evidence: { fixture: runId, componentInstanceId: reworkFixture.summary.ids.componentInstanceId } },
});
reworkOrder = await request('REWORK: refresh order', 'GET', `/production/${reworkOrder.id}`, { token });
reworkOrder = await request('REWORK: complete order', 'POST', `/production/commands/orders/${reworkOrder.id}/complete`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:order-complete` }, body: { expectedVersion: reworkOrder.aggregateVersion },
});
reworkOrder = await request('REWORK: close order', 'POST', `/production/commands/orders/${reworkOrder.id}/close`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:order-close` },
  body: { expectedVersion: reworkOrder.aggregateVersion, qcDispositionCleared: true, reworkCleared: true, materialReconciled: true },
});
await request('REWORK: complete request', 'POST', `/production/commands/rework/${reworkRequestId}/complete`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-rework:request-complete` }, body: { expectedVersion: productionRework.aggregateVersion },
});
assert((await readInstance(token, reworkFixture)).state === 'PRODUCED_WAITING_QC', 'Same returned instance comes back to FINAL QC');
await pass(token, reworkFixture, checklist, 'RETURN_REWORK_PASS');
await stageAfterQc(token, reworkFixture, 'RETURN_REWORK');
assert((await readInstance(token, reworkFixture)).state === 'IN_YARD', 'Reworked returned instance reaches Yard after FINAL PASS');

await returnProjectInstance(token, scrapFixture, 'SCRAP');
const scrapFailure = await failWithNcr(token, scrapFixture, checklist, 'RETURN_SCRAP_FAIL');
await request('SCRAP: disposition', 'POST', `/qc/commands/ncr/${scrapFailure.ncr.id}/scrap`, {
  token, headers: { 'Idempotency-Key': `${runId}:return-scrap:disposition` },
  body: { expectedVersion: Number(scrapFailure.ncr.metadata?.aggregateVersion ?? 1), reason: 'Returned component is not recoverable', approvedQuantity: 1, unit: 'PCS' },
});
assert((await readInstance(token, scrapFixture)).state === 'SCRAPPED', 'Returned SCRAP instance reaches canonical SCRAPPED state');
const scrapSuggestion = await request('SCRAP: read Dispatch suggestion', 'POST', '/logistics/dispatch-orders/suggest', { token, body: { projectId: scrapFixture.summary.ids.projectId } });
assert(!dataOf(scrapSuggestion).some((row) => row.componentInstanceId === scrapFixture.summary.ids.componentInstanceId), 'SCRAPPED instance cannot dispatch');

const final = {
  inventory: await request('Final Inventory', 'GET', '/inventory/overview', { token }),
  qc: await request('Final QC', 'GET', '/qc/read-model/workspace', { token }),
  yard: await request('Final Yard', 'GET', '/yard/dashboard', { token }),
  logistics: await request('Final Logistics', 'GET', '/logistics/dispatch-dashboard', { token }),
  activity: dataOf(await request('Read ActivityLog evidence', 'GET', '/system/activity-logs', { token })),
};
const workflowActivity = final.activity.filter((row) => Date.parse(row.createdAt) >= Date.parse(evidence.startedAt));
assert(workflowActivity.length > 0, 'Reverse certification writes ActivityLog');

evidence.completedAt = new Date().toISOString();
evidence.summary = {
  stepCount: evidence.steps.length + Object.values(evidence.fixtures).reduce((sum, fixture) => sum + fixture.summary.stepCount, 0),
  assertionCount: evidence.assertions.length + Object.values(evidence.fixtures).reduce((sum, fixture) => sum + fixture.summary.assertionCount, 0),
  failedAssertions: evidence.assertions.filter((row) => !row.pass).length,
  baseline,
  final,
  ids: {
    pass: passFixture.summary.ids,
    rework: { ...reworkFixture.summary.ids, ncrId: reworkFailure.ncr.id, reworkProductionOrderId: reworkOrder.id },
    scrap: { ...scrapFixture.summary.ids, ncrId: scrapFailure.ncr.id },
  },
  labels: {
    pass: passFixture.summary.labels,
    rework: reworkFixture.summary.labels,
    scrap: scrapFixture.summary.labels,
  },
  activityCount: workflowActivity.length,
  dashboardChanged: {
    inventory: JSON.stringify(baseline.inventory) !== JSON.stringify(final.inventory),
    qc: JSON.stringify(baseline.qc) !== JSON.stringify(final.qc),
    yard: JSON.stringify(baseline.yard) !== JSON.stringify(final.yard),
    logistics: JSON.stringify(baseline.logistics) !== JSON.stringify(final.logistics),
  },
};
await writeFile(evidenceFile, JSON.stringify(evidence, null, 2));
await chmod(evidenceFile, 0o600);
console.log(JSON.stringify({ evidenceFile, runId, summary: evidence.summary }, null, 2));
