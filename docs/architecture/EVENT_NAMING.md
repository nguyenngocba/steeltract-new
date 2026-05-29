# EVENT NAMING STANDARD

FORMAT:
domain.entity.action

EXAMPLES:

inventory.item.received
inventory.item.issued
inventory.item.returned

production.order.started
production.order.completed

qc.inspection.failed
qc.inspection.passed

yard.slot.assigned
yard.component.moved

project.delivery.completed

RULES:
- lowercase only
- dot notation
- no spaces
- no generic names
- event payloads must be lightweight

