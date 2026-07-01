# Project Timeline Report

Date: 2026-06-30

## Objective

Add project timeline visibility inside the Project Detail workspace.

## Implemented

Added horizontal milestone timeline:

- Ký hợp đồng
- Khởi công
- Hoàn thành móng
- Lắp dựng kết cấu chính
- Lợp mái
- Hoàn thiện
- Nghiệm thu

Statuses:

- Completed
- Current
- Upcoming
- Delayed

Added `Nhật ký` tab with recent WBS task and project return request events from runtime data.

## Data Sources

- Project progress percentage.
- Project delay detection.
- WBS task planned/actual dates.
- Project return request creation timestamps.

## Limitations

- Timeline milestones are derived from current project progress because a persisted project milestone model does not exist yet.
- Photos/documents are empty states until Project attachments are linked.

