import { prisma } from '../../src/database/prisma'

async function main() {

  await prisma.workflowDefinition.createMany({
    data: [
      {
        workflowCode: 'WF-PO-001',

        workflowName:
          'Purchase Order Approval',

        module: 'erp',

        triggerType: 'manual',

        steps: [
          'Manager Approval',
          'Finance Approval',
          'Director Approval',
        ],

        status: 'active',
      },

      {
        workflowCode: 'WF-NCR-001',

        workflowName:
          'NCR Corrective Workflow',

        module: 'qc',

        triggerType: 'automatic',

        steps: [
          'QC Review',
          'Root Cause',
          'Corrective Action',
          'Verification',
        ],

        status: 'active',
      },
    ],
  })

  await prisma.approvalRequest.createMany({
    data: [
      {
        requestCode: 'APR-001',

        module: 'erp',

        referenceCode: 'PO-2026-001',

        requester: 'warehouse',

        approver: 'manager',

        approvalLevel: 1,

        status: 'pending',
      },

      {
        requestCode: 'APR-002',

        module: 'qc',

        referenceCode: 'NCR-001',

        requester: 'qc',

        approver: 'director',

        approvalLevel: 2,

        status: 'pending',
      },
    ],
  })

  await prisma.automationRule.createMany({
    data: [
      {
        ruleCode: 'AUTO-001',

        ruleName:
          'Low Inventory Alert',

        triggerEvent:
          'inventory.low',

        conditions: {
          quantity: '<= 10',
        },

        actions: {
          notification: true,
          email: true,
        },

        status: 'active',
      },
    ],
  })

  console.log('WORKFLOW SEEDED')
}

main()
