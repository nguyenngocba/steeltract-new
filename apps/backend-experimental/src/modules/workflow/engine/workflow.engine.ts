import EventEmitter from 'eventemitter3'

export const workflowBus =
  new EventEmitter()

workflowBus.on(
  'approval.created',
  (payload) => {

    console.log(
      'APPROVAL EVENT',
      payload
    )
  }
)

workflowBus.on(
  'workflow.started',
  (payload) => {

    console.log(
      'WORKFLOW STARTED',
      payload
    )
  }
)
