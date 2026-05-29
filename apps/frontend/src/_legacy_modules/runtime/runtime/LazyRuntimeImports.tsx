import {
  lazy,
} from 'react'

export const ExecutiveCommandCenterPage =
  lazy(() =>

    import(
      '../../modules/executive-module/pages/ExecutiveCommandCenterPage'
    ).then((module) => ({

      default:
        module.ExecutiveCommandCenterPage,
    })),
  )

export const AnalyticsDashboardPage =
  lazy(() =>

    import(
      '../../modules/analytics-module/pages/AnalyticsDashboardPage'
    ).then((module) => ({

      default:
        module.AnalyticsDashboardPage,
    })),
  )

export const DigitalTwinPage =
  lazy(() =>

    import(
      '../../modules/digital-twin-module/pages/DigitalTwinPage'
    ).then((module) => ({

      default:
        module.DigitalTwinPage,
    })),
  )
