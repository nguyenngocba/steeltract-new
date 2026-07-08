# Slow Query Report

Date: 2026-07-07

Scope: EPIC 102 / Sprint RT.1.

## Detector

Threshold:

* SQL duration > 200 ms

When exceeded:

* in-memory slow query record is added to `GET /performance/metrics`
* sanitized JSON line is appended to `docs/runtime/slow-query.log`
* backend logger emits a warning

## Log Format

Example:

```json
{"endpoint":"/dashboard/cockpit","method":"GET","model":"InventoryTransaction","action":"SELECT","elapsed":241,"occurredAt":"2026-07-07T00:00:00.000Z"}
```

## Data Excluded

The slow query log does not include:

* raw SQL
* SQL params
* request body
* authorization headers
* user-sensitive values

## Current State

`docs/runtime/slow-query.log` is created only when a slow query is observed at runtime.

If no slow query has occurred, absence of the log file means no runtime slow-query event has been recorded by this process yet.

## Recommended Review Cadence

During development:

* check after exercising dashboard/detail screens.

Before production optimization:

* run controlled scenarios with realistic seed data.
* group slow query rows by `endpoint + model + action`.
* compare against `docs/audit/enterprise-index-audit.md`.

