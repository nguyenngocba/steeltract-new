import { Router } from 'express'

import { prisma } from '../../database/prisma'

import {
  predictInventory,
  predictMaintenance,
  optimizeProduction,
} from './agents/ai.engine'

export const aiRouter = Router()

# =========================================================
# AGENTS
# =========================================================

aiRouter.get(
  '/agents',
  async (_, res) => {

    const agents =
      await prisma.aiAgent.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(agents)
  }
)

# =========================================================
# PREDICTIONS
# =========================================================

aiRouter.get(
  '/predictions',
  async (_, res) => {

    const predictions =
      await prisma.aiPrediction.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

    res.json(predictions)
  }
)

# =========================================================
# INVENTORY FORECAST
# =========================================================

aiRouter.post(
  '/predict/inventory',
  async (req, res) => {

    const result =
      await predictInventory(
        req.body.quantity
      )

    const prediction =
      await prisma.aiPrediction.create({
        data: {
          predictionCode:
            `INV-${Date.now()}`,

          predictionType:
            'inventory_forecast',

          inputData:
            req.body,

          predictionResult:
            result,

          confidence: 88,
        },
      })

    res.json(prediction)
  }
)

# =========================================================
# MAINTENANCE FORECAST
# =========================================================

aiRouter.post(
  '/predict/maintenance',
  async (req, res) => {

    const result =
      await predictMaintenance(
        req.body.temperature
      )

    const prediction =
      await prisma.aiPrediction.create({
        data: {
          predictionCode:
            `MNT-${Date.now()}`,

          predictionType:
            'maintenance_prediction',

          inputData:
            req.body,

          predictionResult:
            result,

          confidence: 91,
        },
      })

    res.json(prediction)
  }
)

# =========================================================
# PRODUCTION OPTIMIZATION
# =========================================================

aiRouter.post(
  '/optimize/production',
  async (req, res) => {

    const result =
      await optimizeProduction(
        req.body.efficiency
      )

    const optimization =
      await prisma.aiOptimization.create({
        data: {
          optimizationCode:
            `OPT-${Date.now()}`,

          optimizationType:
            'production',

          beforeValue:
            result.before,

          afterValue:
            result.after,

          improvement:
            result.improvement,
        },
      })

    res.json(optimization)
  }
)

# =========================================================
# AI CHAT
# =========================================================

aiRouter.post(
  '/chat',
  async (req, res) => {

    const {
      message,
    } = req.body

    const response =
      `AI analyzed: ${message}`

    const conversation =
      await prisma.aiConversation.create({
        data: {
          conversationCode:
            `CHAT-${Date.now()}`,

          userMessage:
            message,

          aiResponse:
            response,

          agentType:
            'factory_ai',
        },
      })

    res.json(conversation)
  }
)
