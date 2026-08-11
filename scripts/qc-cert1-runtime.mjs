import { createHash } from 'node:crypto';
import { chmod, writeFile } from 'node:fs/promises';

const baseUrl = process.env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100';
const runId = `${process.env.RUNTIME_RUN_PREFIX ?? 'SYSTEM-QC-CERT1'}-${Date.now()}`;
const evidenceFile = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-qc-cert1-runtime-evidence.json';
const evidence = { runId, baseUrl, startedAt: new Date().toISOString(), steps: [], assertions: [], checkpoints: [] };

function assert(condition, message, details) {
  const result = { pass: Boolean(condition), message, details };
  evidence.assertions.push(result);
  if (!condition) throw new Error(`${message}: ${JSON.stringify(details)}`);
}

function verify(condition, message, details) {
  evidence.assertions.push({ pass: Boolean(condition), message, details });
  return Boolean(condition);
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
  const text = await response.text();
  let responseBody;
  try { responseBody = text ? JSON.parse(text) : null; } catch { responseBody = text; }
  evidence.steps.push({
    label, method, path, status: response.status,
    durationMs: Math.round((performance.now() - started) * 100) / 100,
    response: responseBody,
  });
  if (!expected.includes(response.status)) {
    throw new Error(`${label} returned ${response.status}: ${text.slice(0, 1200)}`);
  }
  return responseBody;
}

function dataOf(value) {
  if (Array.isArray(value)) return value;
  return value?.data ?? value?.items ?? [];
}

function stableHash(value) {
  const canonicalize = (item) => {
    if (Array.isArray(item)) return item.map(canonicalize);
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item)
          .filter(([, nested]) => nested !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, canonicalize(nested)]),
      );
    }
    return item;
  };
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

async function readInstances(token, productionOrderId) {
  return dataOf(await request('Read physical ComponentInstances', 'GET', `/components/foundation/instances?productionOrderId=${productionOrderId}&limit=100`, { token }));
}

async function readInstance(token, productionOrderId, instanceId) {
  const instances = await readInstances(token, productionOrderId);
  const instance = instances.find((row) => row.id === instanceId);
  assert(Boolean(instance), 'Physical ComponentInstance remains addressable', { instanceId });
  return instance;
}

async function checkpoint(token, name, ids) {
  const [qc, finishedGoods, yard, instances] = await Promise.all([
    request(`${name}: QC workspace`, 'GET', '/qc/read-model/workspace', { token }),
    request(`${name}: Finished Goods`, 'GET', `/components/instances/finished-goods?productionOrderId=${ids.productionOrderId}&limit=100`, { token }),
    request(`${name}: Yard dashboard`, 'GET', '/yard/dashboard', { token }),
    readInstances(token, ids.productionOrderId),
  ]);
  evidence.checkpoints.push({
    name,
    qcSummary: qc?.summary ?? qc,
    finishedGoodsIds: dataOf(finishedGoods).map((row) => row.id),
    yardSummary: yard?.summary ?? yard,
    instanceStates: Object.fromEntries(instances.map((row) => [row.id, row.state])),
  });
}

async function createFinalInspection(token, checklist, context, label, result) {
  let inspection = await request(`${label}: Create FINAL inspection`, 'POST', '/qc/inspections', {
    token,
    body: {
      inspectionNo: `${runId}-${label}`,
      checklistId: checklist.id,
      productionOrderId: context.productionOrderId,
      componentInstanceId: context.instanceId,
      projectId: context.projectId,
      status: 'READY',
      metadata: { fixture: runId, scenario: label },
    },
  });
  inspection = await request(`${label}: Start FINAL inspection`, 'POST', `/qc/inspections/${inspection.id}/start`, { token, body: {} });
  await request(`${label}: Record FINAL checklist ${result}`, 'POST', `/qc/inspections/${inspection.id}/results`, {
    token,
    body: {
      checklistItemId: checklist.items[0].id,
      category: 'FINAL',
      status: result,
      notes: `${runId} ${label}`,
    },
  });
  return request(`${label}: Read inspection before decision`, 'GET', `/qc/inspections/${inspection.id}`, { token });
}

async function passInspection(token, checklist, context, label) {
  const inspection = await createFinalInspection(token, checklist, context, label, 'PASS');
  const decided = await request(`${label}: Canonical PASS`, 'POST', `/qc/commands/inspections/${inspection.id}/pass`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:${label}:pass` },
    body: { expectedVersion: Number(inspection.metadata?.aggregateVersion ?? 0), notes: `${runId} ${label}` },
  });
  return decided;
}

async function failWithNcr(token, checklist, context, label) {
  const inspection = await createFinalInspection(token, checklist, context, label, 'FAIL');
  const failed = await request(`${label}: Canonical FAIL`, 'POST', `/qc/commands/inspections/${inspection.id}/fail`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:${label}:fail` },
    body: { expectedVersion: Number(inspection.metadata?.aggregateVersion ?? 0), notes: `${runId} ${label}` },
  });
  const ncr = await request(`${label}: Create canonical NCR`, 'POST', `/qc/commands/inspections/${inspection.id}/ncr`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:${label}:ncr` },
    body: {
      expectedVersion: Number(failed.metadata?.aggregateVersion ?? 1),
      title: `${runId} ${label} defect`,
      description: 'Runtime physical QC certification defect',
      severity: 'HIGH',
      defectCode: `${label}_DEFECT`,
      reasonCode: 'CERTIFICATION',
    },
  });
  return { inspection: failed, ncr };
}

async function stageToYard(token, instanceId, suffix) {
  let slots = dataOf(await request(`${suffix}: Read available Yard slots`, 'GET', '/yard/slots?status=AVAILABLE&limit=200', { token }));
  if (!slots.length) {
    const zones = dataOf(await request(`${suffix}: Read active Yard zones`, 'GET', '/yard/zones?status=ACTIVE&limit=100', { token }));
    assert(Boolean(zones[0]?.id), 'Active Yard zone exists', { suffix });
    slots = [await request(`${suffix}: Create Yard slot`, 'POST', `/yard/zones/${zones[0].id}/slots`, {
      token,
      body: {
        code: `${runId}-${suffix}-SLOT`, status: 'AVAILABLE', x: Date.now() % 100000,
        y: Math.floor(Date.now() / 10) % 100000, width: 1, height: 1, maxStackLevel: 1,
        metadata: { fixture: runId },
      },
    })];
  }
  return request(`${suffix}: Stage eligible instance to Yard`, 'POST', '/yard/stage', {
    token,
    body: { componentInstanceId: instanceId, slotId: slots[0].id, reason: `${runId} ${suffix}` },
  });
}

const credentials = {
  username: process.env.RUNTIME_ADMIN_USERNAME ?? 'admin',
  password: process.env.RUNTIME_ADMIN_PASSWORD ?? '123456789',
};
const login = await request('Login administrator', 'POST', '/auth/login', { body: credentials });
const token = login.accessToken;
assert(Boolean(token), 'Administrator receives a real JWT');

const baseline = {
  inventory: await request('Baseline Inventory overview', 'GET', '/inventory/overview', { token }),
  qc: await request('Baseline QC workspace', 'GET', '/qc/read-model/workspace', { token }),
  finishedGoods: await request('Baseline Finished Goods', 'GET', '/components/instances/finished-goods?limit=1', { token }),
  yard: await request('Baseline Yard dashboard', 'GET', '/yard/dashboard', { token }),
};

const warehouses = dataOf(await request('Read canonical warehouses', 'GET', '/master-data/warehouses?active=true', { token }));
const materialWarehouse = warehouses.find((row) => row.active && row.allowReceipt && !row.allowProduction);
const productionWarehouse = warehouses.find((row) => row.active && row.allowProduction);
assert(materialWarehouse && productionWarehouse, 'Material and Production warehouse capabilities exist', {
  materialWarehouse: materialWarehouse?.id,
  productionWarehouse: productionWarehouse?.id,
});
const zones = dataOf(await request('Read inventory zones', 'GET', '/inventory/zones?limit=100', { token }));
const mainZone = zones.find((row) => row.warehouseId === materialWarehouse.id);
const productionZone = zones.find((row) => row.warehouseId === productionWarehouse.id);
assert(mainZone && productionZone, 'Inventory zones exist for both warehouses');
const categories = dataOf(await request('Read inventory categories', 'GET', '/inventory/categories?limit=100', { token }));
const category = categories.find((row) => row.active !== false) ?? categories[0];
assert(Boolean(category?.id), 'Canonical inventory category exists');

const material = await request('Create certification material', 'POST', '/inventory/items', {
  token,
  body: {
    code: `${runId}-MAT`, name: `${runId} Material`, unitId: 'uom_pcs', unit: 'PCS',
    categoryId: category.id, minimumStock: 10, materialUsageType: 'PRIMARY',
    zoneId: mainZone.id, slotId: `${runId}-MAIN`, level: mainZone.level ?? 'L1',
  },
});
const receipt = await request('Receipt certification material', 'POST', '/inventory/transactions', {
  token,
  headers: { 'Idempotency-Key': `${runId}:receipt` },
  body: {
    type: 'IMPORT', referenceModule: 'SYSTEM_QC_CERT1', referenceId: `${runId}:receipt`, remarks: runId,
    items: [{ inventoryItemId: material.id, quantity: 200, unitId: 'uom_pcs', unitPrice: 25000,
      warehouseId: materialWarehouse.id, zoneId: mainZone.id, slotId: `${runId}-MAIN`, level: mainZone.level ?? 'L1' }],
  },
});
const transfer = await request('Transfer material to Production', 'POST', '/inventory/transactions', {
  token,
  headers: { 'Idempotency-Key': `${runId}:transfer-production` },
  body: {
    type: 'TRANSFER', referenceModule: 'SYSTEM_QC_CERT1', referenceId: `${runId}:transfer-production`, remarks: runId,
    items: [
      { inventoryItemId: material.id, quantity: -100, unitId: 'uom_pcs', unitPrice: 25000,
        warehouseId: materialWarehouse.id, zoneId: mainZone.id, slotId: `${runId}-MAIN`, level: mainZone.level ?? 'L1' },
      { inventoryItemId: material.id, quantity: 100, unitId: 'uom_pcs', unitPrice: 25000,
        warehouseId: productionWarehouse.id, zoneId: productionZone.id, slotId: `${runId}-PROD`, level: productionZone.level ?? 'L1' },
    ],
  },
});

const project = await request('Create Project', 'POST', '/projects', {
  token, body: { code: `${runId}-PRJ`, name: `${runId} Project`, status: 'ACTIVE' },
});
const canonical = await request('Create Component definition and requirement', 'POST', '/components/foundation/definition-requirements', {
  token,
  body: {
    name: `${runId} Component`, componentType: 'BEAM', profile: 'H300',
    projectId: project.id, requiredQuantity: 5, note: runId,
  },
});
const component = canonical.component;
const requirement = canonical.requirement;

let revision = await request('Create Component revision', 'POST', `/components/commands/${component.id}/revisions`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:revision` },
  body: { expectedComponentVersion: component.aggregateVersion, revisionNo: 'A', content: { fixture: runId } },
});
const lines = [{ materialId: material.id, quantity: 5, uom: 'PCS', unitId: 'uom_pcs', wastePercent: 0, category: 'MAIN_MATERIAL' }];
const routing = [{ stepNo: 1, stepName: 'Fabrication', workshop: 'MAIN', expectedHours: 1, qcRequired: true }];
const contentHash = stableHash({ lines, routing });
let bom = await request('Replace Engineering BOM', 'POST', `/components/commands/${component.id}/revisions/${revision.id}/bom/replace`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:bom-replace` },
  body: { expectedVersion: revision.aggregateVersion, expectedBomVersion: revision.bomDefinition.aggregateVersion, lines, routing, contentHash },
});
bom = await request('Validate Engineering BOM', 'POST', `/components/commands/${component.id}/revisions/${revision.id}/bom/validate`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:bom-validate` },
  body: { expectedVersion: revision.aggregateVersion + 1, expectedBomVersion: bom.aggregateVersion, contentHash },
});
revision = { ...revision, aggregateVersion: revision.aggregateVersion + 1, bomDefinition: bom };
revision = await request('Submit Component revision review', 'POST', `/components/commands/${component.id}/revisions/${revision.id}/submit-review`, {
  token, headers: { 'Idempotency-Key': `${runId}:revision-review` }, body: { expectedVersion: revision.aggregateVersion },
});
revision = await request('Approve Component revision', 'POST', `/components/commands/${component.id}/revisions/${revision.id}/approve`, {
  token, headers: { 'Idempotency-Key': `${runId}:revision-approve` }, body: { expectedVersion: revision.aggregateVersion },
});
const componentBeforeRelease = await request('Read Component before release', 'GET', `/components/${component.id}`, { token });
revision = await request('Release Component revision', 'POST', `/components/commands/${component.id}/revisions/${revision.id}/release`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:revision-release` },
  body: { expectedVersion: revision.aggregateVersion, expectedComponentVersion: componentBeforeRelease.aggregateVersion },
});

const engineeringBasis = {
  componentId: component.id,
  componentRevisionId: revision.id,
  bomDefinitionId: revision.bomDefinition.id,
  contentHash,
  verifiedAt: new Date().toISOString(),
};
let order = await request('Create Production Order quantity five', 'POST', '/production/commands/orders', {
  token,
  headers: { 'Idempotency-Key': `${runId}:po-create` },
  body: {
    orderNo: `${runId}-PO`, title: `${runId} Production Order`, projectId: project.id,
    componentRequirementId: requirement.id, quantity: 5, unit: 'PCS', engineeringBasis,
  },
});
order = await request('Release Production Order', 'POST', `/production/commands/orders/${order.id}/release`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:po-release` },
  body: { expectedVersion: order.aggregateVersion, workOrders: [{ routingOperationId: '1', productCode: component.code, quantity: 5, sequence: 1 }] },
});
const reservation = await request('Reserve Production material', 'POST', `/production/${order.id}/reservations`, {
  token, body: { autoReserve: true, note: runId },
});
order = await request('Mark Production Order ready', 'POST', `/production/commands/orders/${order.id}/ready`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:po-ready` },
  body: { expectedVersion: order.aggregateVersion, routingGatePassed: true, materialGatePassed: true, blockingGatePassed: true },
});
const issues = await request('Issue Production material', 'POST', `/production/reservations/${reservation.id}/issue`, {
  token, body: { remarks: runId },
});
order = await request('Start Production Order', 'POST', `/production/commands/orders/${order.id}/start`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:po-start` },
  body: { expectedVersion: order.aggregateVersion, volatileGatesPassed: true },
});
const workOrder = order.workOrders[0];
const cockpit = await request('Read active Production execution', 'GET', `/production/read-model/cockpit?search=${encodeURIComponent(order.orderNo)}&limit=10`, { token });
const executionLog = dataOf(cockpit)[0]?.logs?.find((row) => row.message === 'production.execution.started');
const execution = { id: executionLog?.metadata?.aggregateId, aggregateVersion: executionLog?.metadata?.aggregateVersion };
assert(Boolean(workOrder?.id && execution.id), 'Production WorkOrder and execution were created', { workOrderId: workOrder?.id, executionId: execution.id });
const instances = await readInstances(token, order.id);
assert(instances.length === 5 && instances.every((row) => row.state === 'PLANNED'), 'Quantity five generated exactly five PLANNED physical instances', {
  count: instances.length, states: instances.map((row) => row.state),
});
const assignments = await request('Assign all physical instances to execution', 'POST', '/production/commands/instance-executions/assign', {
  token, body: { productionExecutionId: execution.id, componentInstanceIds: instances.map((row) => row.id) },
});
for (const [index, initial] of assignments.entries()) {
  const started = await request(`Start instance execution ${index + 1}`, 'POST', `/production/commands/instance-executions/${initial.id}/start`, { token, body: {} });
  await request(`Complete instance execution ${index + 1}`, 'POST', `/production/commands/instance-executions/${started.id}/complete`, { token, body: {} });
}
await request('Complete Production execution', 'POST', `/production/commands/executions/${execution.id}/complete`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:execution-complete` },
  body: { productionOrderId: order.id, workOrderId: workOrder.id, expectedVersion: execution.aggregateVersion },
});
await request('Complete Work Order', 'POST', `/production/commands/work-orders/${workOrder.id}/complete`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:work-order-complete` },
  body: { productionOrderId: order.id, expectedVersion: workOrder.aggregateVersion },
});
await request('Record material consumption', 'POST', `/production/${order.id}/consume`, {
  token, body: { inventoryItemId: material.id, consumedQty: 25, scrapQty: 0, remark: runId },
});
await request('Record Production completion quantity five', 'POST', '/production/commands/completions', {
  token,
  headers: { 'Idempotency-Key': `${runId}:completion` },
  body: {
    productionOrderId: order.id, expectedVersion: order.aggregateVersion,
    workOrderId: workOrder.id, executionRunId: execution.id,
    quantity: 5, unit: 'PCS', completedQty: 5, rejectedQty: 0, scrapQty: 0, remainingQty: 0,
    evidence: { fixture: runId },
  },
});
let orderView = await request('Read Production Order before completion', 'GET', `/production/${order.id}`, { token });
order = await request('Complete Production Order', 'POST', `/production/commands/orders/${order.id}/complete`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:po-complete` },
  body: { expectedVersion: orderView.aggregateVersion },
});
const waitingInstances = await readInstances(token, order.id);
assert(waitingInstances.every((row) => row.state === 'PRODUCED_WAITING_QC'), 'All five physical instances wait for canonical FINAL QC', {
  states: waitingInstances.map((row) => row.state),
});

const checklist = await request('Create dedicated FINAL checklist', 'POST', '/qc/checklists', {
  token,
  body: {
    code: `${runId}-FINAL`, name: `${runId} Final Inspection`, type: 'FINAL', revision: 'A',
    description: 'SYSTEM.QC.CERT.1 authoritative final checklist', isActive: true,
    items: [{ sequence: 1, title: 'Final dimensional and visual acceptance', required: true }],
    metadata: { fixture: runId },
  },
});
assert(Boolean(checklist.id && checklist.items?.[0]?.id), 'Dedicated authoritative FINAL checklist exists');

const [passInstance, failInstance, reworkInstance, useAsIsInstance, scrapInstance] = waitingInstances;
const ids = {
  productionOrderId: order.id,
  projectId: project.id,
};

const passInspectionResult = await passInspection(token, checklist, {
  ...ids, instanceId: passInstance.id,
}, 'PASS');
assert((await readInstance(token, order.id, passInstance.id)).state === 'QC_PASSED', 'PASS moves physical instance to QC_PASSED');
const passFinishedGoods = dataOf(await request('PASS: Verify Finished Goods eligibility', 'GET', `/components/instances/finished-goods?productionOrderId=${order.id}&limit=100`, { token }));
assert(passFinishedGoods.some((row) => row.id === passInstance.id), 'PASS physical instance is Finished Goods eligible before Yard handoff');
const passPlacement = await stageToYard(token, passInstance.id, 'PASS');
assert((await readInstance(token, order.id, passInstance.id)).state === 'IN_YARD', 'PASS instance can enter Yard');
await checkpoint(token, 'AFTER_PASS', ids);

const failed = await failWithNcr(token, checklist, { ...ids, instanceId: failInstance.id }, 'FAIL');
assert((await readInstance(token, order.id, failInstance.id)).state === 'QC_FAILED', 'FAIL moves physical instance to QC_FAILED');
await checkpoint(token, 'AFTER_FAIL', ids);

const reworkFailed = await failWithNcr(token, checklist, { ...ids, instanceId: reworkInstance.id }, 'REWORK_FAIL');
const reworkNcr = await request('REWORK: Complete NCR disposition', 'POST', `/qc/commands/ncr/${reworkFailed.ncr.id}/rework`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:rework:disposition` },
  body: { expectedVersion: Number(reworkFailed.ncr.metadata?.aggregateVersion ?? 1), reason: 'Certified weld rework required', approvedQuantity: 1, unit: 'PCS' },
});
assert((await readInstance(token, order.id, reworkInstance.id)).state === 'REWORK', 'REWORK disposition moves the same physical instance to REWORK');
orderView = await request('Read original order before Production rework', 'GET', `/production/${order.id}`, { token });
const reworkRequestId = `${runId}-REWORK-REQUEST`;
const productionRework = await request('Accept Production rework', 'POST', '/production/commands/rework/accept', {
  token,
  headers: { 'Idempotency-Key': `${runId}:production-rework-accept` },
  body: {
    reworkRequestId,
    qcNcrId: reworkFailed.ncr.id,
    originalProductionOrderId: order.id,
    expectedVersion: orderView.aggregateVersion,
    orderNo: `${runId}-REWORK-PO`,
    title: `${runId} Rework Production Order`,
    reason: 'Correct NCR weld defect',
    routingScope: { componentInstanceId: reworkInstance.id },
    engineeringBasis,
  },
});
let reworkOrder;
let reworkPassInspection;
let reworkPlacement;
if (productionRework?.reworkProductionOrderId) {
  reworkOrder = await request('Read accepted Rework order', 'GET', `/production/${productionRework.reworkProductionOrderId}`, { token });
  reworkOrder = await request('Release Rework order', 'POST', `/production/commands/orders/${reworkOrder.id}/release`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-order-release` },
    body: { expectedVersion: reworkOrder.aggregateVersion, workOrders: [{ routingOperationId: '1', productCode: component.code, quantity: 1, sequence: 1 }] },
  });
  reworkOrder = await request('Mark Rework order ready', 'POST', `/production/commands/orders/${reworkOrder.id}/ready`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-order-ready` },
    body: { expectedVersion: reworkOrder.aggregateVersion, routingGatePassed: true, materialGatePassed: true, blockingGatePassed: true },
  });
  reworkOrder = await request('Start Rework order', 'POST', `/production/commands/orders/${reworkOrder.id}/start`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-order-start` },
    body: { expectedVersion: reworkOrder.aggregateVersion, volatileGatesPassed: true },
  });
  const reworkWorkOrder = reworkOrder.workOrders?.[0];
  assert(Boolean(reworkWorkOrder?.id), 'Rework WorkOrder exists after order start', { productionOrderId: reworkOrder.id });
  const reworkCockpit = await request('Read active Rework execution', 'GET', `/production/read-model/cockpit?search=${encodeURIComponent(reworkOrder.orderNo)}&limit=10`, { token });
  const reworkExecutionLog = dataOf(reworkCockpit)[0]?.logs?.find((row) => row.message === 'production.execution.started');
  const reworkExecution = { id: reworkExecutionLog?.metadata?.aggregateId, aggregateVersion: reworkExecutionLog?.metadata?.aggregateVersion };
  assert(Boolean(reworkExecution.id), 'Rework execution exists');
  const reworkAssignments = await request('Assign same instance to Rework execution', 'POST', '/production/commands/instance-executions/assign', {
    token, body: { productionExecutionId: reworkExecution.id, componentInstanceIds: [reworkInstance.id] },
  });
  let reworkAssignment = await request('Start physical Rework execution', 'POST', `/production/commands/instance-executions/${reworkAssignments[0].id}/start`, { token, body: {} });
  reworkAssignment = await request('Complete physical Rework execution', 'POST', `/production/commands/instance-executions/${reworkAssignment.id}/complete`, { token, body: {} });
  await request('Complete Rework execution run', 'POST', `/production/commands/executions/${reworkExecution.id}/complete`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-execution-complete` },
    body: { productionOrderId: reworkOrder.id, workOrderId: reworkWorkOrder.id, expectedVersion: reworkExecution.aggregateVersion },
  });
  await request('Complete Rework WorkOrder', 'POST', `/production/commands/work-orders/${reworkWorkOrder.id}/complete`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-work-order-complete` },
    body: { productionOrderId: reworkOrder.id, expectedVersion: reworkWorkOrder.aggregateVersion },
  });
  await request('Record Rework completion', 'POST', '/production/commands/completions', {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-completion` },
    body: {
      productionOrderId: reworkOrder.id, expectedVersion: reworkOrder.aggregateVersion,
      workOrderId: reworkWorkOrder.id, executionRunId: reworkExecution.id,
      quantity: 1, unit: 'PCS', completedQty: 1, rejectedQty: 0, scrapQty: 0, remainingQty: 0,
      evidence: { fixture: runId, componentInstanceId: reworkInstance.id },
    },
  });
  reworkOrder = await request('Read Rework order before completion', 'GET', `/production/${reworkOrder.id}`, { token });
  reworkOrder = await request('Complete Rework order', 'POST', `/production/commands/orders/${reworkOrder.id}/complete`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-order-complete` },
    body: { expectedVersion: reworkOrder.aggregateVersion },
  });
  reworkOrder = await request('Close Rework order', 'POST', `/production/commands/orders/${reworkOrder.id}/close`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:rework-order-close` },
    body: { expectedVersion: reworkOrder.aggregateVersion, qcDispositionCleared: true, reworkCleared: true, materialReconciled: true },
  });
  await request('Complete Production rework request', 'POST', `/production/commands/rework/${reworkRequestId}/complete`, {
    token,
    headers: { 'Idempotency-Key': `${runId}:production-rework-complete` },
    body: { expectedVersion: productionRework.aggregateVersion },
  });
  verify((await readInstance(token, order.id, reworkInstance.id)).state === 'PRODUCED_WAITING_QC', 'Rework returns the same physical instance to FINAL QC');
  reworkPassInspection = await passInspection(token, checklist, { ...ids, instanceId: reworkInstance.id }, 'REWORK_PASS');
  assert((await readInstance(token, order.id, reworkInstance.id)).state === 'QC_PASSED', 'Second FINAL PASS moves reworked instance to QC_PASSED');
  const reworkFinishedGoods = dataOf(await request('REWORK: Verify Finished Goods eligibility', 'GET', `/components/instances/finished-goods?productionOrderId=${order.id}&limit=100`, { token }));
  assert(reworkFinishedGoods.some((row) => row.id === reworkInstance.id), 'Reworked physical instance is Finished Goods eligible before Yard handoff');
  reworkPlacement = await stageToYard(token, reworkInstance.id, 'REWORK');
  assert((await readInstance(token, order.id, reworkInstance.id)).state === 'IN_YARD', 'Reworked instance can enter Yard after second FINAL PASS');
} else {
  assert(false, 'Production accepted canonical REWORK request', {
    endpoint: 'POST /production/commands/rework/accept',
    response: productionRework,
  });
}
await checkpoint(token, 'AFTER_REWORK_PASS', ids);

const useAsIsFailed = await failWithNcr(token, checklist, { ...ids, instanceId: useAsIsInstance.id }, 'USE_AS_IS_FAIL');
const useAsIsNcr = await request('USE-AS-IS: Complete NCR disposition', 'POST', `/qc/commands/ncr/${useAsIsFailed.ncr.id}/use-as-is`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:use-as-is:disposition` },
  body: { expectedVersion: Number(useAsIsFailed.ncr.metadata?.aggregateVersion ?? 1), reason: 'Engineering concession approved', approvedQuantity: 1, unit: 'PCS' },
});
assert((await readInstance(token, order.id, useAsIsInstance.id)).state === 'USE_AS_IS', 'USE-AS-IS moves physical instance to canonical accepted state');
const useAsIsFinishedGoods = dataOf(await request('USE-AS-IS: Verify Finished Goods eligibility', 'GET', `/components/instances/finished-goods?productionOrderId=${order.id}&limit=100`, { token }));
assert(useAsIsFinishedGoods.some((row) => row.id === useAsIsInstance.id), 'USE-AS-IS physical instance is Finished Goods eligible before Yard handoff');
const useAsIsPlacement = await stageToYard(token, useAsIsInstance.id, 'USE-AS-IS');
assert((await readInstance(token, order.id, useAsIsInstance.id)).state === 'IN_YARD', 'USE-AS-IS instance is Finished Goods eligible and can enter Yard');
await checkpoint(token, 'AFTER_USE_AS_IS', ids);

const scrapFailed = await failWithNcr(token, checklist, { ...ids, instanceId: scrapInstance.id }, 'SCRAP_FAIL');
const scrapNcr = await request('SCRAP: Complete NCR disposition', 'POST', `/qc/commands/ncr/${scrapFailed.ncr.id}/scrap`, {
  token,
  headers: { 'Idempotency-Key': `${runId}:scrap:disposition` },
  body: { expectedVersion: Number(scrapFailed.ncr.metadata?.aggregateVersion ?? 1), reason: 'Non-recoverable dimensional defect', approvedQuantity: 1, unit: 'PCS' },
});
assert((await readInstance(token, order.id, scrapInstance.id)).state === 'SCRAPPED', 'SCRAP moves physical instance to SCRAPPED');
await checkpoint(token, 'AFTER_SCRAP', ids);

const finalFinishedGoods = dataOf(await request('Read final canonical Finished Goods', 'GET', `/components/instances/finished-goods?productionOrderId=${order.id}&limit=100`, { token }));
const finalEligibleIds = new Set(finalFinishedGoods.map((row) => row.id));
for (const staged of [passInstance, reworkInstance, useAsIsInstance]) {
  verify(!finalEligibleIds.has(staged.id), 'Yard-staged physical instance leaves the Finished Goods handoff queue', { instanceId: staged.id });
}
for (const blocked of [failInstance, scrapInstance]) {
  verify(!finalEligibleIds.has(blocked.id), 'Blocked physical instance is excluded from canonical Finished Goods', { instanceId: blocked.id });
}
const finalInventory = await request('Read final material', 'GET', `/inventory/items/${material.id}`, { token });
assert(Number(finalInventory.quantity) === 175, 'QC decisions preserve material inventory after one canonical consumption', {
  expected: 175, actual: finalInventory.quantity,
});
const projectionHealth = await request('Read projection health', 'GET', '/query-api/projections/health', { token });
const finalDashboards = {
  inventory: await request('Final Inventory overview', 'GET', '/inventory/overview', { token }),
  production: await request('Final Production cockpit', 'GET', `/production/read-model/cockpit?search=${encodeURIComponent(order.orderNo)}&limit=10`, { token }),
  qc: await request('Final QC workspace', 'GET', '/qc/read-model/workspace', { token }),
  finishedGoods: await request('Final Finished Goods workspace', 'GET', `/components/instances/finished-goods?productionOrderId=${order.id}&limit=100`, { token }),
  yard: await request('Final Yard dashboard', 'GET', '/yard/dashboard', { token }),
  logistics: await request('Final Logistics dashboard', 'GET', '/logistics/dispatch-dashboard', { token }),
};

evidence.completedAt = new Date().toISOString();
evidence.summary = {
  stepCount: evidence.steps.length,
  assertionCount: evidence.assertions.length,
  failedAssertions: evidence.assertions.filter((row) => !row.pass).length,
  baseline,
  finalDashboards,
  projectionHealth,
  expectedInventoryQuantity: 175,
  ids: {
    materialId: material.id,
    receiptId: receipt.id,
    transferId: transfer.id,
    projectId: project.id,
    componentId: component.id,
    requirementId: requirement.id,
    productionOrderId: order.id,
    workOrderId: workOrder.id,
    productionExecutionId: execution.id,
    checklistId: checklist.id,
    instanceIds: {
      pass: passInstance.id,
      fail: failInstance.id,
      rework: reworkInstance.id,
      useAsIs: useAsIsInstance.id,
      scrap: scrapInstance.id,
    },
    inspectionIds: {
      pass: passInspectionResult.id,
      fail: failed.inspection.id,
      reworkFail: reworkFailed.inspection.id,
      reworkPass: reworkPassInspection?.id,
      useAsIs: useAsIsFailed.inspection.id,
      scrap: scrapFailed.inspection.id,
    },
    ncrIds: {
      fail: failed.ncr.id,
      rework: reworkFailed.ncr.id,
      useAsIs: useAsIsFailed.ncr.id,
      scrap: scrapFailed.ncr.id,
    },
    reworkRequestId,
    reworkProductionOrderId: reworkOrder?.id,
    yardPlacementIds: { pass: passPlacement.id, rework: reworkPlacement?.id, useAsIs: useAsIsPlacement.id },
  },
  labels: {
    materialCode: material.code,
    projectCode: project.code,
    componentName: component.name,
    productionOrderNo: order.orderNo,
    instanceNos: Object.fromEntries(waitingInstances.map((row) => [row.id, row.instanceNo])),
  },
};

await writeFile(evidenceFile, JSON.stringify(evidence, null, 2));
await chmod(evidenceFile, 0o600);
console.log(JSON.stringify({ evidenceFile, runId, summary: evidence.summary }, null, 2));
