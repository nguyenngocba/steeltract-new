import {
  QueryClient,
} from '@tanstack/react-query'

import { queryKeys } from './query-keys'

export function invalidateInventory(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.inventory.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateProjects(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.projects.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateComponents(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.components.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateTasks(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.tasks.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateWorkflow(
  client: QueryClient,
) {
  return client.invalidateQueries({
    queryKey: queryKeys.workflow.all,
  })
}

export function invalidateAttachments(
  client: QueryClient,
) {
  return client.invalidateQueries({
    queryKey: queryKeys.attachments.all,
  })
}

export function invalidateJobs(
  client: QueryClient,
) {
  return client.invalidateQueries({
    queryKey: queryKeys.jobs.all,
  })
}

export function invalidateAnalytics(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey:
        queryKeys.analyticsEngine.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateProduction(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.production.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateQc(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.qc.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.production.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateYard(
  client: QueryClient,
) {
  return Promise.all([
    client.invalidateQueries({
      queryKey: queryKeys.yard.all,
    }),
    client.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    }),
  ])
}

export function invalidateByDomainEvent(
  client: QueryClient,
  eventName: string,
) {
  if (
    eventName.startsWith('inventory.')
  ) {
    return invalidateInventory(client)
  }

  if (
    eventName.startsWith('project.')
  ) {
    return invalidateProjects(client)
  }

  if (
    eventName.startsWith('component.')
  ) {
    return invalidateComponents(client)
  }

  if (eventName.startsWith('task.')) {
    return invalidateTasks(client)
  }

  if (
    eventName.startsWith('workflow.')
  ) {
    return invalidateWorkflow(client)
  }

  if (
    eventName.startsWith('attachment.')
  ) {
    return invalidateAttachments(client)
  }

  if (
    eventName.startsWith('job.') ||
    eventName.startsWith('outbox.')
  ) {
    return invalidateJobs(client)
  }

  if (
    eventName.startsWith('production.')
  ) {
    return Promise.all([
      invalidateProduction(client),
      invalidateAnalytics(client),
    ])
  }

  if (eventName.startsWith('qc.')) {
    return Promise.all([
      invalidateQc(client),
      invalidateAnalytics(client),
    ])
  }

  if (eventName.startsWith('yard.')) {
    return Promise.all([
      invalidateYard(client),
      invalidateAnalytics(client),
    ])
  }

  if (
    eventName.startsWith('analytics.')
  ) {
    return invalidateAnalytics(client)
  }

  return Promise.resolve()
}
