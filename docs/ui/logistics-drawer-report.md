# Logistics Drawer Report

## Drawer Standard

Dispatch detail uses:

`ModuleDetailDrawer size="md"`

Sections:

- Thông tin
- Hàng hóa
- Checklist
- Timeline / Logs
- Sticky footer actions

## Actions

Actions are status-driven:

- Planned/Draft -> Bắt đầu bốc hàng
- Loading -> Rời bãi
- In Transit -> Đã đến công trình
- Arrived -> Công trình nhận hàng
- Received -> Hoàn thành

## UX Notes

The drawer is right-side, full-height, scrolls internally, and does not use a centered modal.
