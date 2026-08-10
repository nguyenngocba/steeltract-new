import { createHash } from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';

const envFile = process.env.RUNTIME_CREDENTIALS_FILE ?? '/tmp/steeltrack-runtime1-credentials.env';
const env = Object.fromEntries(
  (await readFile(envFile, 'utf8'))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
const baseUrl = process.env.RUNTIME_API_URL ?? env.RUNTIME_API_URL ?? 'http://127.0.0.1:3100';
const runPrefix = process.env.RUNTIME_RUN_PREFIX ?? 'SYSTEM-RUNTIME1';
const runId = `${runPrefix}-${Date.now()}`;
const includeReverse = process.env.RUNTIME_INCLUDE_REVERSE !== 'false';
const evidence = { runId, baseUrl, startedAt: new Date().toISOString(), steps: [], assertions: [] };

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
  const text = await response.text();
  let responseBody;
  try { responseBody = text ? JSON.parse(text) : null; } catch { responseBody = text; }
  const step = {
    label, method, path, status: response.status,
    durationMs: Math.round((performance.now() - started) * 100) / 100,
    response: responseBody,
  };
  evidence.steps.push(step);
  if (!expected.includes(response.status)) {
    throw new Error(`${label} returned ${response.status}: ${text.slice(0, 1000)}`);
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

const credentials = {
  username: process.env.RUNTIME_ADMIN_USERNAME ?? env.RUNTIME_ADMIN_USERNAME,
  password: process.env.RUNTIME_ADMIN_PASSWORD ?? env.RUNTIME_ADMIN_PASSWORD,
};
const login = await request('Login administrator', 'POST', '/auth/login', { body: credentials });
const token = login.accessToken;
assert(Boolean(token), 'Administrator receives a real JWT');

const baseline = {
  inventory: await request('Baseline inventory dashboard', 'GET', '/inventory/overview', { token }),
  production: await request('Baseline Production cockpit', 'GET', '/production/read-model/cockpit', { token }),
  qc: await request('Baseline QC workspace', 'GET', '/qc/read-model/workspace', { token }),
  yard: await request('Baseline Yard dashboard', 'GET', '/yard/dashboard', { token }),
  logistics: await request('Baseline Logistics dashboard', 'GET', '/logistics/dispatch-dashboard', { token }),
  executive: await request('Baseline Executive dashboard', 'GET', '/dashboard/executive-cockpit', { token }),
};

const zones = dataOf(await request('Read inventory zones', 'GET', '/inventory/zones?limit=100', { token }));
const mainZone = zones.find((zone) => zone.warehouseId === 'wh-main-steeltrack');
const productionZone = zones.find((zone) => zone.warehouseId === 'wh-production-steeltrack');
assert(mainZone && productionZone, 'MAIN and PRODUCTION warehouse zones exist', {
  mainZone: mainZone?.id, productionZone: productionZone?.id,
});
const categories = dataOf(await request('Read inventory categories', 'GET', '/inventory/categories?limit=100', { token }));
const category = categories.find((item) => item.active !== false) ?? categories[0];
assert(Boolean(category?.id), 'Canonical inventory category exists');

const material = await request('Create runtime material', 'POST', '/inventory/items', {
  token,
  body: {
    code: `${runId}-MAT`, name: `${runId} Material`, unitId: 'uom_pcs', unit: 'PCS',
    categoryId: category.id, minimumStock: 10, materialUsageType: 'PRIMARY',
    zoneId: mainZone.id, slotId: `${runId}-MAIN`, level: mainZone.level ?? 'L1',
  },
});

const receiptBody = {
  type: 'IMPORT', referenceModule: runPrefix, referenceId: `${runId}:receipt`,
  remarks: `${runId} receipt`,
  items: [{ inventoryItemId: material.id, quantity: 100, unitId: 'uom_pcs', unitPrice: 25000,
    warehouseId: 'wh-main-steeltrack', zoneId: mainZone.id, slotId: `${runId}-MAIN`, level: mainZone.level ?? 'L1' }],
};
const receiptKey = `${runId}:receipt`;
const receipt = await request('Receipt material', 'POST', '/inventory/transactions', {
  token, body: receiptBody, headers: { 'Idempotency-Key': receiptKey },
});
const replay = await request('Replay identical receipt', 'POST', '/inventory/transactions', {
  token, body: receiptBody, headers: { 'Idempotency-Key': receiptKey },
});
assert(receipt.id === replay.id, 'Identical idempotent receipt returns the original transaction', { receipt: receipt.id, replay: replay.id });
await request('Reject same idempotency key with different payload', 'POST', '/inventory/transactions', {
  token, body: { ...receiptBody, remarks: `${runId} conflict` }, headers: { 'Idempotency-Key': receiptKey }, expected: [409],
});

await request('Transfer material to Production', 'POST', '/inventory/transactions', {
  token,
  headers: { 'Idempotency-Key': `${runId}:transfer-production` },
  body: {
    type: 'TRANSFER', referenceModule: runPrefix, referenceId: `${runId}:transfer-production`,
    remarks: `${runId} transfer to production`,
    items: [
      { inventoryItemId: material.id, quantity: -60, unitId: 'uom_pcs', unitPrice: 25000,
        warehouseId: 'wh-main-steeltrack', zoneId: mainZone.id, slotId: `${runId}-MAIN`, level: mainZone.level ?? 'L1' },
      { inventoryItemId: material.id, quantity: 60, unitId: 'uom_pcs', unitPrice: 25000,
        warehouseId: 'wh-production-steeltrack', zoneId: productionZone.id, slotId: `${runId}-PROD`, level: productionZone.level ?? 'L1' },
    ],
  },
});

const project = await request('Create Project', 'POST', '/projects', {
  token, body: { code: `${runId}-PRJ`, name: `${runId} Project`, status: 'ACTIVE' },
});
const canonical = await request('Create Component definition and requirement', 'POST', '/components/foundation/definition-requirements', {
  token, body: { name: `${runId} Component`, componentType: 'BEAM', profile: 'H300', projectId: project.id, requiredQuantity: 1, note: runId },
});
const component = canonical.component;
const requirement = canonical.requirement;

let revision = await request('Create Component revision', 'POST', `/components/commands/${component.id}/revisions`, {
  token, headers: { 'Idempotency-Key': `${runId}:revision` },
  body: { expectedComponentVersion: component.aggregateVersion, revisionNo: 'A', content: { fixture: runId } },
});
const lines = [{ materialId: material.id, quantity: 5, uom: 'PCS', unitId: 'uom_pcs', wastePercent: 0, category: 'MAIN_MATERIAL' }];
const routing = [{ stepNo: 1, stepName: 'Fabrication', workshop: 'MAIN', expectedHours: 1, qcRequired: true }];
const contentHash = stableHash({ lines, routing });
let bom = await request('Replace Engineering BOM', 'POST', `/components/commands/${component.id}/revisions/${revision.id}/bom/replace`, {
  token, headers: { 'Idempotency-Key': `${runId}:bom-replace` },
  body: { expectedVersion: revision.aggregateVersion, expectedBomVersion: revision.bomDefinition.aggregateVersion, lines, routing, contentHash },
});
const componentAfterBom = await request('Read Component after BOM', 'GET', `/components/${component.id}`, { token });
bom = await request('Validate Engineering BOM', 'POST', `/components/commands/${component.id}/revisions/${revision.id}/bom/validate`, {
  token, headers: { 'Idempotency-Key': `${runId}:bom-validate` },
  body: { expectedVersion: revision.aggregateVersion + 1, expectedBomVersion: bom.aggregateVersion, contentHash },
});
await request('Read Component before review', 'GET', `/components/${component.id}`, { token });
let activeRevision = { ...revision, aggregateVersion: revision.aggregateVersion + 1, bomDefinition: bom };
activeRevision = await request('Submit revision review', 'POST', `/components/commands/${component.id}/revisions/${activeRevision.id}/submit-review`, {
  token, headers: { 'Idempotency-Key': `${runId}:review` }, body: { expectedVersion: activeRevision.aggregateVersion },
});
activeRevision = await request('Approve revision', 'POST', `/components/commands/${component.id}/revisions/${activeRevision.id}/approve`, {
  token, headers: { 'Idempotency-Key': `${runId}:approve` }, body: { expectedVersion: activeRevision.aggregateVersion },
});
const componentBeforeRelease = await request('Read Component before release', 'GET', `/components/${component.id}`, { token });
activeRevision = await request('Release revision', 'POST', `/components/commands/${component.id}/revisions/${activeRevision.id}/release`, {
  token, headers: { 'Idempotency-Key': `${runId}:release-revision` },
  body: { expectedVersion: activeRevision.aggregateVersion, expectedComponentVersion: componentBeforeRelease.aggregateVersion },
});

let order = await request('Create Production Order', 'POST', '/production/commands/orders', {
  token, headers: { 'Idempotency-Key': `${runId}:po-create` },
  body: {
    orderNo: `${runId}-PO`, title: `${runId} Production Order`, projectId: project.id,
    componentRequirementId: requirement.id, quantity: 1, unit: 'PCS',
    engineeringBasis: { componentId: component.id, componentRevisionId: activeRevision.id,
      bomDefinitionId: activeRevision.bomDefinition.id, contentHash, verifiedAt: new Date().toISOString() },
  },
});
order = await request('Release Production Order', 'POST', `/production/commands/orders/${order.id}/release`, {
  token, headers: { 'Idempotency-Key': `${runId}:po-release` },
  body: { expectedVersion: order.aggregateVersion, workOrders: [{ routingOperationId: '1', productCode: component.code, quantity: 1, sequence: 1 }] },
});
const reservation = await request('Reserve Production material', 'POST', `/production/${order.id}/reservations`, {
  token, body: { autoReserve: true, note: runId },
});
order = await request('Mark Production Order ready', 'POST', `/production/commands/orders/${order.id}/ready`, {
  token, headers: { 'Idempotency-Key': `${runId}:po-ready` },
  body: { expectedVersion: order.aggregateVersion, routingGatePassed: true, materialGatePassed: true, blockingGatePassed: true },
});
const issues = await request('Issue Production material', 'POST', `/production/reservations/${reservation.id}/issue`, {
  token, body: { remarks: runId },
});
order = await request('Start Production Order', 'POST', `/production/commands/orders/${order.id}/start`, {
  token, headers: { 'Idempotency-Key': `${runId}:po-start` }, body: { expectedVersion: order.aggregateVersion, volatileGatesPassed: true },
});
let orderView = await request('Read running Production Order', 'GET', `/production/${order.id}`, { token });
const workOrder = order.workOrders[0];
const runningCockpit = await request('Read active Production execution', 'GET', `/production/read-model/cockpit?search=${encodeURIComponent(order.orderNo)}&limit=10`, { token });
const executionLog = dataOf(runningCockpit)[0]?.logs?.find((item) => item.message === 'production.execution.started');
const productionExecution = { id: executionLog?.metadata?.aggregateId, aggregateVersion: executionLog?.metadata?.aggregateVersion };
assert(Boolean(workOrder?.id && productionExecution?.id), 'Production release/start created WorkOrder and execution', {
  workOrderId: workOrder?.id, productionExecutionId: productionExecution?.id,
});
const instances = dataOf(await request('Read generated ComponentInstances', 'GET', `/components/foundation/instances?productionOrderId=${order.id}`, { token }));
const instance = instances[0];
assert(instances.length === 1 && instance.state === 'PLANNED', 'One physical ComponentInstance was generated for quantity one', { count: instances.length, state: instance?.state });
const assignments = await request('Assign instance execution', 'POST', '/production/commands/instance-executions/assign', {
  token, body: { productionExecutionId: productionExecution.id, componentInstanceIds: [instance.id] },
});
let assignment = assignments[0];
assignment = await request('Start instance execution', 'POST', `/production/commands/instance-executions/${assignment.id}/start`, { token, body: {} });
assignment = await request('Complete instance execution', 'POST', `/production/commands/instance-executions/${assignment.id}/complete`, { token, body: {} });
let execution = await request('Complete Production execution', 'POST', `/production/commands/executions/${productionExecution.id}/complete`, {
  token, headers: { 'Idempotency-Key': `${runId}:execution-complete` },
  body: { productionOrderId: order.id, workOrderId: workOrder.id, expectedVersion: productionExecution.aggregateVersion },
});
await request('Complete Work Order', 'POST', `/production/commands/work-orders/${workOrder.id}/complete`, {
  token, headers: { 'Idempotency-Key': `${runId}:work-order-complete` },
  body: { productionOrderId: order.id, expectedVersion: workOrder.aggregateVersion },
});
await request('Record Production material consumption', 'POST', `/production/${order.id}/consume`, {
  token, body: { inventoryItemId: material.id, consumedQty: 5, scrapQty: 0, remark: runId },
});
await request('Record Production completion', 'POST', '/production/commands/completions', {
  token, headers: { 'Idempotency-Key': `${runId}:production-completion` },
  body: {
    productionOrderId: order.id, expectedVersion: order.aggregateVersion,
    workOrderId: workOrder.id, executionRunId: productionExecution.id,
    quantity: 1, unit: 'PCS', completedQty: 1, rejectedQty: 0, scrapQty: 0, remainingQty: 0,
    evidence: { fixture: runId },
  },
});
orderView = await request('Read Production Order before completion', 'GET', `/production/${order.id}`, { token });
order = await request('Complete Production Order', 'POST', `/production/commands/orders/${order.id}/complete`, {
  token, headers: { 'Idempotency-Key': `${runId}:po-complete` },
  body: { expectedVersion: orderView.aggregateVersion },
});

const checklists = dataOf(await request('Read FINAL checklist', 'GET', '/qc/checklists?type=FINAL&isActive=true&limit=100', { token }));
const checklist = checklists.find((item) => item.items?.length) ?? checklists[0];
assert(Boolean(checklist?.id && checklist.items?.[0]?.id), 'Active FINAL checklist with item exists');
let inspection = await request('Create FINAL inspection', 'POST', '/qc/inspections', {
  token, body: { inspectionNo: `${runId}-QC`, checklistId: checklist.id, productionOrderId: order.id,
    componentInstanceId: instance.id, projectId: project.id, status: 'READY', metadata: { fixture: runId } },
});
inspection = await request('Start FINAL inspection', 'POST', `/qc/inspections/${inspection.id}/start`, { token, body: {} });
await request('Record FINAL checklist PASS', 'POST', `/qc/inspections/${inspection.id}/results`, {
  token, body: { checklistItemId: checklist.items[0].id, category: 'FINAL', status: 'PASS', notes: runId },
});
inspection = await request('Read FINAL inspection before decision', 'GET', `/qc/inspections/${inspection.id}`, { token });
inspection = await request('Canonical final QC PASS', 'POST', `/qc/commands/inspections/${inspection.id}/pass`, {
  token, headers: { 'Idempotency-Key': `${runId}:qc-pass` },
  body: { expectedVersion: Number(inspection.metadata?.aggregateVersion ?? 0), notes: runId },
});
const finishedGoods = dataOf(await request('Read canonical Finished Goods', 'GET', `/components/instances/finished-goods?productionOrderId=${order.id}&limit=100`, { token }));
assert(finishedGoods.some((item) => item.id === instance.id), 'QC-passed instance appears in canonical Finished Goods');

let availableSlots = dataOf(await request('Read available Yard slots', 'GET', '/yard/slots?status=AVAILABLE&limit=200', { token }));
const slot = availableSlots[0];
assert(Boolean(slot?.id), 'Available Yard slot exists');
const placement = await request('Stage ComponentInstance to Yard', 'POST', '/yard/stage', {
  token, body: { componentInstanceId: instance.id, slotId: slot.id, reason: runId },
});
let dispatch = await request('Create physical dispatch', 'POST', '/logistics/dispatch-orders', {
  token, body: { projectId: project.id, vehicle: `${runId}-TRUCK`, driver: 'Runtime Certification', notes: runId,
    items: [{ type: 'COMPONENT', componentInstanceId: instance.id, quantity: 1 }] },
});
dispatch = await request('Mark dispatch loading', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/loading`, { token, body: { checklist: { verified: true } } });
dispatch = await request('Depart dispatch', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/depart`, { token, body: {} });
dispatch = await request('Arrive dispatch', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/arrive`, { token, body: {} });
dispatch = await request('Receive dispatch', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/receive`, { token, body: {} });
dispatch = await request('Complete dispatch installation', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/complete`, { token, body: {} });

let returnSlot;
let reverseTransfer;
if (includeReverse) {
  dispatch = await request('Request reverse logistics', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/return-request`, {
    token, body: { reason: `${runId} customer return` },
  });
  dispatch = await request('Depart reverse logistics', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/return-depart`, {
    token, body: { reason: `${runId} return transport` },
  });
  availableSlots = dataOf(await request('Read return Yard slot', 'GET', '/yard/slots?status=AVAILABLE&limit=200', { token }));
  returnSlot = availableSlots.find((item) => item.id !== slot.id) ?? availableSlots[0];
  dispatch = await request('Receive returned instance to Yard quarantine', 'PATCH', `/logistics/dispatch-orders/${dispatch.id}/return-to-yard`, {
    token, body: { reason: `${runId} return to yard`, placements: [{ componentInstanceId: instance.id, slotId: returnSlot.id }] },
  });

  reverseTransfer = await request('Return unused Production material to MAIN', 'POST', '/inventory/transactions', {
    token, headers: { 'Idempotency-Key': `${runId}:reverse-production-stock` },
    body: {
      type: 'TRANSFER', referenceModule: runPrefix, referenceId: `${runId}:reverse-production-stock`, remarks: runId,
      items: [
        { inventoryItemId: material.id, quantity: -5, unitId: 'uom_pcs', unitPrice: 25000,
          warehouseId: 'wh-production-steeltrack', zoneId: productionZone.id, slotId: `${runId}-PROD`, level: productionZone.level ?? 'L1' },
        { inventoryItemId: material.id, quantity: 5, unitId: 'uom_pcs', unitPrice: 25000,
          warehouseId: 'wh-main-steeltrack', zoneId: mainZone.id, slotId: `${runId}-MAIN`, level: mainZone.level ?? 'L1' },
      ],
    },
  });
}

const finalState = {
  inventory: await request('Final inventory dashboard', 'GET', '/inventory/overview', { token }),
  production: await request('Final Production cockpit', 'GET', '/production/read-model/cockpit', { token }),
  qc: await request('Final QC workspace', 'GET', '/qc/read-model/workspace', { token }),
  yard: await request('Final Yard dashboard', 'GET', '/yard/dashboard', { token }),
  logistics: await request('Final Logistics dashboard', 'GET', '/logistics/dispatch-dashboard', { token }),
  project: await request('Final Project execution read model', 'GET', `/projects/${project.id}/execution`, { token }),
  executive: await request('Final Executive dashboard', 'GET', '/dashboard/executive-cockpit', { token }),
  instance: dataOf(await request('Final ComponentInstance read model', 'GET', `/components/foundation/instances?productionOrderId=${order.id}`, { token }))[0],
};
assert(
  finalState.instance.state === (includeReverse ? 'PRODUCED_WAITING_QC' : 'INSTALLED'),
  includeReverse
    ? 'Returned installed instance is quarantined pending QC'
    : 'Forward workflow leaves the physical instance installed',
  { state: finalState.instance.state },
);
if (includeReverse) assert(reverseTransfer?.id, 'Reverse Production stock transaction persisted');

const transactions = dataOf(await request('Read fixture inventory transactions', 'GET', `/inventory/transactions?page=1&pageSize=100&materialId=${material.id}`, { token }));
const signedMovement = transactions.flatMap((tx) => tx.items ?? []).filter((item) => item.inventoryItemId === material.id).reduce((sum, item) => sum + Number(item.quantity), 0);
assert(signedMovement === 95, 'Inventory movement conservation matches receipt minus production consumption', { signedMovement, expected: 95 });

const activity = dataOf(await request('Read ActivityLog evidence', 'GET', '/system/activity-logs', { token }));
const fixtureActivity = activity.filter((item) => JSON.stringify(item).includes(runId));
const workflowActivity = activity.filter((item) => Date.parse(item.createdAt) >= Date.parse(evidence.startedAt));
const eventTypes = [...new Set(workflowActivity.map((item) => item.action ?? item.eventType ?? item.type).filter(Boolean))];
assert(workflowActivity.length > 0, 'Runtime workflow produced ActivityLog records', { count: workflowActivity.length, eventTypes });

evidence.finishedAt = new Date().toISOString();
evidence.summary = {
  stepCount: evidence.steps.length,
  assertionCount: evidence.assertions.length,
  failedAssertions: evidence.assertions.filter((item) => !item.pass).length,
  maxApiDurationMs: Math.max(...evidence.steps.map((step) => step.durationMs)),
  slowApis: evidence.steps.filter((step) => step.durationMs >= 500).map(({ label, path, durationMs }) => ({ label, path, durationMs })),
  ids: { materialId: material.id, projectId: project.id, componentId: component.id, requirementId: requirement.id,
    productionOrderId: order.id, componentInstanceId: instance.id, inspectionId: inspection.id, yardPlacementId: placement.id,
    dispatchOrderId: dispatch.id, receiptId: receipt.id, reverseTransferId: reverseTransfer?.id ?? null },
  labels: {
    materialCode: material.code,
    projectCode: project.code,
    componentCode: component.code,
    componentName: component.name,
    productionOrderNo: order.orderNo,
    componentInstanceNo: instance.instanceNo,
    inspectionNo: inspection.inspectionNo,
    dispatchOrderNo: dispatch.orderNo,
  },
  dashboardChanged: {
    inventory: JSON.stringify(baseline.inventory) !== JSON.stringify(finalState.inventory),
    production: JSON.stringify(baseline.production) !== JSON.stringify(finalState.production),
    qc: JSON.stringify(baseline.qc) !== JSON.stringify(finalState.qc),
    yard: JSON.stringify(baseline.yard) !== JSON.stringify(finalState.yard),
    logistics: JSON.stringify(baseline.logistics) !== JSON.stringify(finalState.logistics),
    executive: JSON.stringify(baseline.executive) !== JSON.stringify(finalState.executive),
  },
  activityCount: workflowActivity.length,
  fixtureLinkedActivityCount: fixtureActivity.length,
  activityEventTypes: eventTypes,
};
const output = process.env.RUNTIME_EVIDENCE_FILE ?? '/tmp/system-runtime1-business-evidence.json';
await writeFile(output, JSON.stringify(evidence, null, 2));
await chmod(output, 0o600);
console.log(JSON.stringify({ output, ...evidence.summary }, null, 2));
