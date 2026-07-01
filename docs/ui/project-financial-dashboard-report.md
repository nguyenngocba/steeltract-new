# Sprint 40PROJ.3 – Project Financial Dashboard Report

Date: 2026-06-30

## Objective

Add Project Cost Control foundation using current data only.

## Runtime Financial Read Model

`GET /projects/runtime` now returns `financial[]`.

Fields:

* `contractValue`
* `budget`
* `actualCost`
* `profit`
* `marginPercent`
* `breakdown`
* `byTime`
* `profitByProgress`

## Cost Sources

Material cost:

* project-linked `inventory_transaction_items.totalAmount`
* `RETURN` rows reduce material cost

Component cost:

* `Component.actualCost`
* fallback to `Component.estimatedCost`

Labor, machine, and other cost:

* returned as `0` because there is no first-class project labor/machine/overhead source yet.

## UI

Project Detail `Tổng quan` now shows:

* Giá trị hợp đồng
* Ngân sách
* Chi phí thực tế
* Lợi nhuận
* Biên lợi nhuận %

Project Health flags budget risk when current material cost exceeds project value.

## Known Limits

* Project contract/budget fields are not first-class persisted fields yet.
* Labor, machine, overhead, logistics, Yard handling, and rework costs are not available.
* Component cost can overlap conceptually with material cost depending on how operators structure production/project costing; a formal Project Cost Control sprint should define accounting rules.

## Verification

* `pnpm -C apps/frontend build` passed.
* `pnpm -C apps/backend-api build` passed.

