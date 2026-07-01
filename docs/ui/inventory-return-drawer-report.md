# Inventory Return Drawer Report

## Drawer Size

Inventory Return Request detail now uses:

`ModuleDetailDrawer size="sm"`

Desktop sizing follows the shared drawer standard:

- width: 45vw
- min width: 720px
- max width: 820px

Mobile remains full width through the shared drawer behavior.

## Header

Header displays:

- Return number
- Status badge
- Project context
- Requester
- Created date

## Sections

The drawer contains:

1. Thông tin phiếu
2. Danh sách vật tư
3. Timeline
4. Photos
5. Logs

## Timeline

Timeline derives from the return request status and activity logs:

- Tạo phiếu trả
- Đính kèm ảnh, when attachment-related logs exist
- Kho nhận phiếu
- Nhập kho
- Đã nghiệm thu / chấp nhận
- Đã từ chối
