import { Router } from 'express'

import { prisma } from '../../database/prisma'

import {
  workflowBus,
} from './engine/workflow.engine'

export const workflowRouter =
  Router()

# =========================================================
# GET WORKFLOWS
# =========================================================

workflowRouter.get(
  '/definitions',
  async (_, res) => {

    const workflows =
      await prisma.workflowDefinition.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(workflows)
  }
)

# =========================================================
# GET APPROVALS
# =========================================================

workflowRouter.get(
  '/approvals',
  async (_, res) => {

    const approvals =
      await prisma.approvalRequest.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(approvals)
  }
)

# =========================================================
# GET AUTOMATION RULES
# =========================================================

workflowRouter.get(
  '/rules',
  async (_, res) => {

    const rules =
      await prisma.automationRule.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(rules)
  }
)

# =========================================================
# CREATE APPROVAL
# =========================================================

workflowRouter.post(
  '/approvals',
  async (req, res) => {

    const approval =
      await prisma.approvalRequest.create({
        data: req.body,
      })

    workflowBus.emit(
      'approval.created',
      approval
    )

    res.json(approval)
  }
)

# =========================================================
# START WORKFLOW
# =========================================================

workflowRouter.post(
  '/start',
  async (req, res) => {

    const body =
      req.body

    const execution =
      await prisma.workflowExecution.create({
        data: {
          executionCode:
            body.executionCode,

          workflowCode:
            body.workflowCode,

          referenceCode:
            body.referenceCode,

          currentStep: 1,

          status: 'running',

          startedBy:
            body.startedBy,
        },
      })

    workflowBus.emit(
      'workflow.started',
      execution
    )

    res.json(execution)
  }
)

# =========================================================
# APPROVE REQUEST
# =========================================================

workflowRouter.post(
  '/approve/:id',
  async (req, res) => {

    const updated =
      await prisma.approvalRequest.update({
        where: {
          id: req.params.id,
        },

        data: {
          status: 'approved',
        },
      })

    res.json(updated)
  }
)
