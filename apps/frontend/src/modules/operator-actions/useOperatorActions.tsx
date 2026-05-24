import {
  ClipboardCheck,
  Factory,
  GitBranch,
  PackagePlus,
  ShieldAlert,
  Truck,
  Warehouse,
} from 'lucide-react'
import {
  useMemo,
} from 'react'

import {
  enterpriseToast,
} from '../../components/ui-system'
import {
  useCurrentUser,
} from '../../lib/auth/useCurrentUser'
import {
  useApproveWorkflowStepMutation,
  useEscalateWorkflowMutation,
} from '../../lib/workflow'
import {
  useCompleteProductionStageMutation,
  useStartProductionOrderMutation,
} from '../production-ui'
import {
  useCompleteQcInspectionMutation,
  useCreateNcrMutation,
  useCreateQcIssueMutation,
  useStartQcInspectionMutation,
} from '../qc-ui'
import {
  useMoveYardItemMutation,
} from '../yard-ui'

import type {
  OperatorAction,
  OperatorActionContext,
  OperatorActionDomain,
} from './operator-action.types'

interface UseOperatorActionsOptions {
  context?: OperatorActionContext
  domains?: OperatorActionDomain[]
}

function contextMissing(
  action: OperatorAction,
  context: OperatorActionContext,
) {
  return action.requiresContext
    ? !context[action.requiresContext]
    : false
}

export function useOperatorActions({
  context = {},
  domains,
}: UseOperatorActionsOptions = {}) {
  const { data: user } = useCurrentUser()
  const startProductionOrder =
    useStartProductionOrderMutation()
  const completeProductionStage =
    useCompleteProductionStageMutation()
  const startInspection =
    useStartQcInspectionMutation()
  const completeInspection =
    useCompleteQcInspectionMutation()
  const createIssue =
    useCreateQcIssueMutation()
  const createNcr = useCreateNcrMutation()
  const moveYardItem =
    useMoveYardItemMutation()
  const approveWorkflow =
    useApproveWorkflowStepMutation()
  const escalateWorkflow =
    useEscalateWorkflowMutation()

  const can = (permission?: string) =>
    !permission ||
    user?.permissions?.includes(permission)

  const actions = useMemo<OperatorAction[]>(
    () => [
      {
        id: 'production.assign-worker',
        label: 'Assign worker',
        description:
          'Open dispatch context for production worker assignment.',
        domain: 'production',
        permission: 'production.write',
        shortcut: 'A W',
        icon: <Factory className="h-3.5 w-3.5" />,
        requiresContext: 'productionOrderId',
        run: () =>
          enterpriseToast.info(
            'Worker assignment drawer is ready for this production order.',
          ),
      },
      {
        id: 'production.advance-stage',
        label: 'Advance stage',
        description:
          'Complete the active fabrication stage and refresh production state.',
        domain: 'production',
        permission: 'production.write',
        shortcut: 'A S',
        icon: <GitBranch className="h-3.5 w-3.5" />,
        requiresContext: 'productionStageId',
        run: () => {
          if (!context.productionStageId) {
            return
          }

          completeProductionStage.mutate({
            stageId: context.productionStageId,
            payload: {
              message:
                'Completed by operator quick action',
            },
          })
        },
      },
      {
        id: 'production.start-order',
        label: 'Start order',
        description:
          'Release the selected production order into execution.',
        domain: 'production',
        permission: 'production.write',
        shortcut: 'S O',
        icon: <Factory className="h-3.5 w-3.5" />,
        requiresContext: 'productionOrderId',
        run: () => {
          if (context.productionOrderId) {
            startProductionOrder.mutate(
              context.productionOrderId,
            )
          }
        },
      },
      {
        id: 'qc.create-issue',
        label: 'Create QC issue',
        description:
          'Create an inspection issue on the selected inspection.',
        domain: 'qc',
        permission: 'qc.write',
        shortcut: 'Q I',
        icon: <ShieldAlert className="h-3.5 w-3.5" />,
        requiresContext: 'qcInspectionId',
        run: () => {
          if (!context.qcInspectionId) {
            return
          }

          createIssue.mutate({
            inspectionId: context.qcInspectionId,
            payload: {
              title:
                'Operator flagged inspection issue',
              severity: 'MEDIUM',
              status: 'OPEN',
            },
          })
        },
      },
      {
        id: 'qc.approve-inspection',
        label: 'Approve inspection',
        description:
          'Complete the selected inspection with pass disposition.',
        domain: 'qc',
        permission: 'qc.write',
        shortcut: 'Q A',
        icon: <ClipboardCheck className="h-3.5 w-3.5" />,
        requiresContext: 'qcInspectionId',
        run: () => {
          if (!context.qcInspectionId) {
            return
          }

          completeInspection.mutate({
            id: context.qcInspectionId,
            payload: {
              status: 'PASSED',
              notes:
                'Approved by operator quick action',
            },
          })
        },
      },
      {
        id: 'qc.escalate-ncr',
        label: 'Escalate NCR',
        description:
          'Create an NCR shell from the selected inspection.',
        domain: 'qc',
        permission: 'qc.write',
        shortcut: 'Q N',
        icon: <ShieldAlert className="h-3.5 w-3.5" />,
        requiresContext: 'qcInspectionId',
        run: () => {
          if (!context.qcInspectionId) {
            return
          }

          createNcr.mutate({
            inspectionId: context.qcInspectionId,
            payload: {
              title:
                'Operator escalated non-conformance',
              severity: 'HIGH',
              status: 'OPEN',
            },
          })
        },
      },
      {
        id: 'qc.start-inspection',
        label: 'Start inspection',
        description:
          'Move the selected inspection into active execution.',
        domain: 'qc',
        permission: 'qc.write',
        shortcut: 'Q S',
        icon: <ClipboardCheck className="h-3.5 w-3.5" />,
        requiresContext: 'qcInspectionId',
        run: () => {
          if (context.qcInspectionId) {
            startInspection.mutate({
              id: context.qcInspectionId,
            })
          }
        },
      },
      {
        id: 'yard.move-item',
        label: 'Move yard item',
        description:
          'Open yard movement flow for the selected placement.',
        domain: 'yard',
        permission: 'yard.write',
        shortcut: 'Y M',
        icon: <Warehouse className="h-3.5 w-3.5" />,
        requiresContext: 'yardPlacementId',
        run: () => {
          if (!context.yardPlacementId) {
            return
          }

          moveYardItem.mutate({
            id: context.yardPlacementId,
            payload: {
              reason:
                'Operator quick action movement request',
            },
          })
        },
      },
      {
        id: 'inventory.dispatch',
        label: 'Dispatch inventory',
        description:
          'Open inventory dispatch context for warehouse movement.',
        domain: 'inventory',
        permission: 'inventory.write',
        shortcut: 'I D',
        icon: <PackagePlus className="h-3.5 w-3.5" />,
        requiresContext: 'inventoryItemId',
        run: () =>
          enterpriseToast.info(
            'Inventory dispatch context is ready for selected stock.',
          ),
      },
      {
        id: 'workflow.approve',
        label: 'Approve workflow',
        description:
          'Approve the selected workflow step.',
        domain: 'workflow',
        permission: 'workflow.write',
        shortcut: 'W A',
        icon: <ClipboardCheck className="h-3.5 w-3.5" />,
        requiresContext: 'workflowInstanceId',
        run: () => {
          if (!context.workflowInstanceId) {
            return
          }

          approveWorkflow.mutate({
            id: context.workflowInstanceId,
            payload: {
              comment:
                'Approved by operator quick action',
            },
          })
        },
      },
      {
        id: 'workflow.escalate',
        label: 'Escalate workflow',
        description:
          'Escalate the selected workflow to its escalation lane.',
        domain: 'workflow',
        permission: 'workflow.write',
        shortcut: 'W E',
        icon: <ShieldAlert className="h-3.5 w-3.5" />,
        requiresContext: 'workflowInstanceId',
        run: () => {
          if (!context.workflowInstanceId) {
            return
          }

          escalateWorkflow.mutate({
            id: context.workflowInstanceId,
            payload: {
              reason:
                'Escalated by operator quick action',
            },
          })
        },
      },
      {
        id: 'procurement.create-material-request',
        label: 'Create material request',
        description:
          'Open material request workflow for procurement shortage.',
        domain: 'procurement',
        permission: 'procurement.write',
        shortcut: 'M R',
        icon: <Truck className="h-3.5 w-3.5" />,
        run: () =>
          enterpriseToast.info(
            'Material request workflow is ready.',
          ),
      },
    ],
    [
      approveWorkflow,
      completeInspection,
      completeProductionStage,
      context,
      createIssue,
      createNcr,
      escalateWorkflow,
      moveYardItem,
      startInspection,
      startProductionOrder,
    ],
  )

  return actions
    .filter((action) =>
      domains ? domains.includes(action.domain) : true,
    )
    .map((action) => ({
      ...action,
      disabled:
        !can(action.permission) ||
        contextMissing(action, context) ||
        action.disabled,
    }))
}
