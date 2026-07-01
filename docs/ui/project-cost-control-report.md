# Project Cost Control Report

Date: 2026-06-30

## Objective

Add project cost control visibility in Project Detail without changing backend schema.

## Implemented

Added Project Detail `Chi phí` tab with:

- Giá trị hợp đồng
- Ngân sách
- Chi phí thực tế
- Lợi nhuận
- Biên lợi nhuận

Added analytics:

- Cost Breakdown
- Cost Burnup
- Profitability

## Data Sources

- Project runtime financial read model.
- Project-linked Inventory transaction values.
- Project-linked component cost values.
- Fallback uses existing project contract/actual runtime values when financial runtime is absent.

## Limitations

- Labor, machine, and other cost buckets are present in the UI but remain zero until those source records exist.
- Forecast line is a deterministic read-model projection, not AI or generated fake data.
- A normalized budget baseline model is still required for formal cost control.

