import { prisma } from '../../src/database/prisma'

async function main() {

  await prisma.aiAgent.createMany({
    data: [
      {
        agentCode: 'AI-001',

        agentName:
          'Inventory Forecast Agent',

        agentType:
          'inventory_prediction',

        model:
          'steeltrack-ai-v1',

        status: 'active',
      },

      {
        agentCode: 'AI-002',

        agentName:
          'Maintenance Prediction Agent',

        agentType:
          'maintenance_prediction',

        model:
          'steeltrack-ai-v1',

        status: 'active',
      },

      {
        agentCode: 'AI-003',

        agentName:
          'Production Optimizer',

        agentType:
          'optimization',

        model:
          'steeltrack-ai-v1',

        status: 'active',
      },
    ],
  })

  console.log('AI SEEDED')
}

main()
