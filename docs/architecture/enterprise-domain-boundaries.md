# Ranh giới Phân hệ & Biên Domain (Enterprise Domain Boundaries) - EPIC210

Tài liệu này định nghĩa ranh giới thiết kế (Bounded Contexts) giữa các module trong hệ thống **SteelTrack**, ma trận phân quyền gọi (Communication Permission Matrix), và cấu trúc chi tiết của từng phân hệ bao gồm Public APIs, Public Events, Snapshots, Read Models, và Ownership.

---

## 1. Bản đồ Ranh giới Phân hệ (Module Boundaries)

SteelTrack được xây dựng dưới dạng Modular Monolith. Mỗi phân hệ (module) hoạt động độc lập và chịu trách nhiệm bảo toàn tính toàn vẹn dữ liệu nghiệp vụ của riêng mình. 

### Các nguyên tắc cốt lõi:
1.  **Không truy vấn chéo cơ sở dữ liệu (No Shared Database Querying)**: 
    Cấm hoàn toàn việc import Prisma Client hoặc truy cập bảng của một module khác trong Controller/Service của module hiện tại.
2.  **Giao tiếp Đồng bộ qua Public API**:
    Nếu cần đọc thông tin tức thời từ module khác, bắt buộc phải gọi thông qua interface Service công khai của module đó (không gọi qua Repository của module đó).
3.  **Giao tiếp Không đồng bộ qua Outbox Event**:
    Mọi hoạt động cập nhật trạng thái chéo module (ví dụ: Sản xuất hoàn thành cấu kiện -> Báo cho Yard xếp dỡ) bắt buộc phải giao tiếp thông qua sự kiện Outbox (Eventual Consistency).

---

## 2. Ma trận Quyền gọi giữa các Phân hệ (Communication Matrix)

Bảng ma trận dưới đây quy định quyền hạn giao tiếp giữa các module. Các ký hiệu viết tắt:
*   `ALLOW_API`: Được phép gọi Public API/Service của module đích.
*   `ALLOW_EVT`: Chỉ được phép lắng nghe Sự kiện (Outbox Events) phát hành bởi module đích.
*   `DENIED`: Nghiêm cấm mọi hình thức gọi API hoặc Repository trực tiếp (chỉ giao tiếp qua event nếu có đăng ký).

| Từ Phân hệ (Caller) | Inventory | Production | Projects | Logistics | QC | Yard | Suppliers | Settings/Rbac |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Inventory** | `-` | `ALLOW_EVT` | `ALLOW_API` | `ALLOW_API` | `ALLOW_EVT` | `DENIED` | `ALLOW_API` | `ALLOW_API` |
| **Production** | `ALLOW_API` | `-` | `ALLOW_API` | `DENIED` | `ALLOW_API` | `DENIED` | `DENIED` | `ALLOW_API` |
| **Projects** | `ALLOW_API` | `ALLOW_EVT` | `-` | `ALLOW_API` | `ALLOW_EVT` | `DENIED` | `DENIED` | `ALLOW_API` |
| **Logistics** | `ALLOW_API` | `ALLOW_EVT` | `ALLOW_API` | `-` | `ALLOW_EVT` | `ALLOW_API` | `DENIED` | `ALLOW_API` |
| **QC** | `ALLOW_API` | `ALLOW_API` | `DENIED` | `DENIED` | `-` | `DENIED` | `ALLOW_API` | `ALLOW_API` |
| **Yard** | `ALLOW_EVT` | `ALLOW_EVT` | `DENIED` | `ALLOW_API` | `ALLOW_EVT` | `-` | `DENIED` | `ALLOW_API` |
| **Suppliers** | `ALLOW_API` | `DENIED` | `DENIED` | `DENIED` | `DENIED` | `DENIED` | `-` | `ALLOW_API` |
| **Settings/Rbac**| `DENIED` | `DENIED` | `DENIED` | `DENIED` | `DENIED` | `DENIED` | `DENIED` | `-` |

### Quy tắc bổ sung đặc thù:
*   **Cấm gọi trực tiếp Repository**: Ví dụ, `InventoryService` tuyệt đối không được phép gọi trực tiếp `ProductionRepository` để thay đổi trạng thái Lệnh sản xuất. Mọi luồng xử lý bắt buộc phải qua `ProductionService` hoặc lắng nghe sự kiện Outbox.
*   **Phục hồi lỗi (Dead-Letter Queue)**: Các lời gọi không đồng bộ qua Outbox Event bị lỗi sẽ được cách ly tại hàng đợi DLQ của Background Engine để xử lý thủ công, tránh gây block luồng nghiệp vụ chính.

---

## 3. Chi tiết Biên Domain cho từng Phân hệ

Dưới đây là đặc tả biên chi tiết cho 8 phân hệ cốt lõi của hệ thống SteelTrack:

### 3.1. Phân hệ Quản lý Kho (Inventory)
*   **Quyền sở hữu bảng (Ownership)**: [inventory_items](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L876), [inventory_transactions](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L943), [inventory_transaction_items](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L983), [inventory_location_stocks](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1000), [return_requests](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1034), [return_request_items](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1059).
*   **Public API (Dịch vụ cung cấp)**:
    *   `InventoryService.reserveStock(itemId, quantity, correlationId)`: Giữ chỗ vật tư phục vụ BOM/Sản xuất.
    *   `InventoryService.createTransaction(dto: CreateInventoryTxDto)`: Ghi nhận nhập/xuất/kho thực tế.
    *   `InventoryService.getAvailableStock(itemId)`: Đọc số dư tồn kho khả dụng hiện thời.
*   **Public Event (Sự kiện phát hành)**:
    *   `inventory.transaction.created`: Phát ra khi hoàn tất ghi nhận nhập/xuất/kho.
    *   `inventory.return.received`: Phát ra khi duyệt nhập kho vật tư thu hồi.
*   **Snapshots**: [inventory_material_snapshots](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1696), [inventory_location_snapshots](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1725).
*   **Read Models**: `DashboardInventoryReadModel` (Cache tổng quan tồn kho).

### 3.2. Phân hệ Quản lý Sản xuất (Production)
*   **Quyền sở hữu bảng (Ownership)**: `work_orders`, `bom_items`, `shifts`, `machine_downtimes`, `production_scrap`, `production_rework`.
*   **Public API (Dịch vụ cung cấp)**:
    *   `ProductionService.createWorkOrder(dto: CreateWorkOrderDto)`: Khởi tạo lệnh sản xuất mới.
    *   `ProductionService.getWorkOrderStatus(workOrderId)`: Lấy trạng thái thực tế của lệnh sản xuất.
*   **Public Event (Sự kiện phát hành)**:
    *   `production.work-order.released`: Lệnh sản xuất chuyển sang trạng thái sẵn sàng chạy.
    *   `production.material.consumed`: Đã ghi nhận tiêu hao vật tư tại dây chuyền.
    *   `production.work-order.completed`: Lệnh sản xuất hoàn thành (sẵn sàng bàn giao cho bãi Yard).
*   **Snapshots**: `ProductionDashboardSnapshot`, `WorkCenterSnapshot`.
*   **Read Models**: `ProductionOeeReadModel` (Hiệu suất tổng thể thiết bị).

### 3.3. Phân hệ Quản lý Bãi (Yard)
*   **Quyền sở hữu bảng (Ownership)**: `yard_zones`, `yard_slots`, `yard_item_placements`, `yard_movements`, `yard_reservations`.
*   **Public API (Dịch vụ cung cấp)**:
    *   `YardService.assignSlot(componentId, warehouseId)`: Tự động phân bổ vị trí tối ưu trên sơ đồ bãi.
    *   `YardService.reserveSlot(slotId, componentId)`: Giữ trước vị trí cho cấu kiện đang vận chuyển đến bãi.
*   **Public Event (Sự kiện phát hành)**:
    *   `yard.component.placed`: Đặt cấu kiện thành công vào vị trí.
    *   `yard.component.moved`: Dịch chuyển nội bộ cấu kiện sang vị trí khác.
*   **Snapshots**: `YardOccupancySnapshot` (Mật độ chiếm dụng bãi).
*   **Read Models**: `YardMap3DReadModel` (Trạng thái bãi phục vụ R3F/ThreeJS).

### 3.4. Phân hệ Quản lý Dự án (Projects)
*   **Quyền sở hữu bảng (Ownership)**: [projects](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1090), [project_templates](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1120), [project_tasks](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1255), [project_task_dependencies](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1276), [project_task_material_allocations](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1306), [project_task_component_allocations](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1332), [project_task_inspections](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1375), [project_task_costs](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1399).
*   **Public API (Dịch vụ cung cấp)**:
    *   `ProjectsService.verifyTaskCompletion(taskId)`: Xác minh công việc đã nghiệm thu.
    *   `ProjectsService.allocateMaterialToTask(taskId, itemId, quantity)`: Ghi nhận phân bổ vật tư.
*   **Public Event (Sự kiện phát hành)**:
    *   `projects.task.progress-updated`: Cập nhật tiến độ WBS.
    *   `projects.task.completed`: Nhiệm vụ WBS chuyển sang trạng thái kết thúc.
*   **Snapshots**: [project_dashboard_snapshots](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1746), `ProjectRuntimeSnapshot`.
*   **Read Models**: `ProjectWbsTreeReadModel` (Mô hình cây WBS và tiến độ).

### 3.5. Phân hệ Điều phối Vận chuyển (Logistics)
*   **Quyền sở hữu bảng (Ownership)**: [dispatch_orders](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1588), [dispatch_items](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1615), [dispatch_events](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1636), [vehicles](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1540), `drivers`, `routes`.
*   **Public API (Dịch vụ cung cấp)**:
    *   `LogisticsService.getDispatchStatus(dispatchOrderId)`: Lấy thông tin lộ trình và tiến độ giao hàng.
*   **Public Event (Sự kiện phát hành)**:
    *   `logistics.dispatch.departed`: Xe xuất phát khỏi bãi.
    *   `logistics.dispatch.arrived`: Xe đến công trường dự án.
    *   `logistics.dispatch.completed`: Biên bản bàn giao POD đã ký nhận thành công.
*   **Snapshots**: [dispatch_dashboard_snapshots](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1766).
*   **Read Models**: `LogisticsRouteReadModel` (Gợi ý tuyến đường).

### 3.6. Phân hệ Kiểm soát Chất lượng (QC)
*   **Quyền sở hữu bảng (Ownership)**: `qc_inspections`, `non_conformance_reports`, `quality_certificates`.
*   **Public API (Dịch vụ cung cấp)**:
    *   `QcService.getInspectionResult(entityType, entityId)`: Lấy lịch sử và kết quả kiểm định của vật tư/cấu kiện.
*   **Public Event (Sự kiện phát hành)**:
    *   `qc.inspection.completed`: Đã hoàn tất phiên đánh giá chất lượng.
    *   `qc.ncr.approved`: Báo cáo NCR không phù hợp đã được duyệt giải pháp khắc phục.
*   **Snapshots**: `QcDashboardSnapshot`.
*   **Read Models**: `QcTraceabilityGraphReadModel` (Đọc phả hệ chất lượng từ phôi đến cấu kiện công trường).

### 3.7. Phân hệ Nhà cung cấp (Suppliers)
*   **Quyền sở hữu bảng (Ownership)**: `suppliers`, `purchase_orders`, `purchase_order_items`, `supplier_prices`.
*   **Public API (Dịch vụ cung cấp)**:
    *   `SuppliersService.getSupplierInfo(supplierId)`: Lấy hồ sơ thông tin nhà cung cấp.
    *   `SuppliersService.verifyPoValidity(poId)`: Kiểm tra đơn hàng PO hợp lệ.
*   **Public Event (Sự kiện phát hành)**:
    *   `suppliers.po.created`: Khởi tạo đơn mua hàng mới.
    *   `suppliers.po.approved`: Phê duyệt đơn mua hàng PO.
*   **Snapshots**: `SupplierPerformanceSnapshot`.
*   **Read Models**: `SupplierPricingReadModel` (So sánh bảng giá).

### 3.8. Phân hệ Thiết lập & Phân quyền (Settings/Rbac)
*   **Quyền sở hữu bảng (Ownership)**: [users](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L504), [roles](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L533), [permissions](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L545), [user_roles](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L561), [role_permissions](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L577).
*   **Public API (Dịch vụ cung cấp)**:
    *   `RbacService.checkUserPermission(userId, permissionCode)`: Xác thực quyền hạn người dùng thực thi tác vụ.
*   **Public Event (Sự kiện phát hành)**:
    *   `rbac.user.permission-changed`: Thay đổi quyền hạn của tài khoản.
*   **Snapshots**: `UserRbacSnapshot`.
*   **Read Models**: `UserPermissionReadModel` (Quyền thao tác cached phục vụ Guards).
