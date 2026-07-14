# QC Server Aggregation Report

## Repository-Owned Metrics

| Metric | Source |
| --- | --- |
| Total | `QcInspection` count by status |
| Pending | `DRAFT` + `READY` |
| In Progress | `IN_PROGRESS` |
| Passed | `PASSED` + `APPROVED` |
| Failed | `FAILED` |
| Rework | `REWORK_REQUIRED` |
| Overdue | Non-closed QC issues with `dueAt < now` |
| Open NCR | Non-closed `NonConformanceReport` |
| Waiting Production Orders | Completed orders without passed/approved QC |

Pass rate is calculated from the global status aggregation, not from the current
page. Defect severity/status grouping and NCR summary are repository queries.

## Historical Trend

The former six fabricated dates and increasing bar heights were removed. Trend
data now comes from one PostgreSQL daily aggregate over the last 30 days using
actual inspection create/complete dates and statuses. With no historical rows,
the frontend renders `Chưa có dữ liệu lịch sử`.

No random, interpolated or placeholder trend point is produced.

