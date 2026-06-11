# Event Naming

Event names use this format:

```txt
domain.entity.action
```

## Examples

- `inventory.item.received`
- `inventory.item.issued`
- `inventory.item.returned`
- `production.order.started`
- `production.order.completed`
- `qc.inspection.failed`
- `qc.inspection.passed`
- `yard.slot.assigned`
- `yard.component.moved`
- `project.delivery.completed`

## Rules

- Lowercase only.
- Dot notation only.
- No spaces.
- No generic names.
- Payloads must be lightweight.

## Payload Guidance

Prefer:

```json
{
  "id": "record-id",
  "changedFields": ["status", "updatedAt"]
}
```

Avoid emitting full database objects. Frontend consumers should refetch server state through TanStack Query or the relevant API layer.
