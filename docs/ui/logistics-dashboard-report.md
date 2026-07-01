# Logistics Dashboard Report

## KPI

The Logistics dashboard now uses real dispatch orders:

- Chờ điều xe: `DRAFT`, `PLANNED`, `LOADING`
- Đang vận chuyển: `IN_TRANSIT`
- Đã giao: `ARRIVED`, `RECEIVED`
- Hoàn thành: `COMPLETED`

## Charts

- Delivery Status: grouped by dispatch status.
- Dispatch Trend: grouped by planned/created date.
- Vehicle Utilization: grouped by vehicle name/plate value.

## Empty State

When no dispatch data exists, the UI uses Cockpit empty states. No fake trips, hardcoded trends, or random data are generated.
