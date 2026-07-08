# Quy chuẩn Đặt tên Doanh nghiệp (Enterprise Naming Conventions) - EPIC210

Tài liệu này định nghĩa bộ quy chuẩn đặt tên (Naming Conventions) đồng nhất cho toàn bộ các lớp của hệ thống **SteelTrack** (ERP + MES + Yard Management). Quy chuẩn này bắt buộc áp dụng đối với Database, Repositories, Events, Snapshots và cơ chế Phân bản (Versioning).

---

## 1. Quy chuẩn Cơ sở dữ liệu (Database Conventions)

Để đảm bảo tính nhất quán giữa mô hình cơ sở dữ liệu vật lý trong PostgreSQL và mô hình ORM trong Prisma, SteelTrack áp dụng các nguyên tắc đặt tên sau:

### 1.1. Tên Bảng (Table Names)
*   **Định dạng**: Chữ thường, số nhiều, snake_case.
*   **Nguyên tắc**: Bắt đầu bằng tên phân hệ (context) để tránh xung đột tên và tạo nhóm bảng rõ ràng.
*   **Bắt buộc**: Sử dụng chỉ thị `@@map("tên_bảng")` trong Prisma Schema để ánh xạ chính xác.
*   **Ví dụ**:
    *   Phân hệ Inventory: [inventory_items](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L876), [inventory_location_stocks](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1000).
    *   Phân hệ Projects: [projects](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1090), [project_tasks](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1255).
    *   Bảng Master dữ liệu cấu hình: Bắt đầu bằng tiền tố `master_`. Ví dụ: [master_warehouses](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L668), [master_units](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L809).

### 1.2. Tên Cột (Column Names)
*   **Định dạng**: camelCase.
*   **Nguyên tắc**: Nhằm tương thích trực tiếp với JavaScript/TypeScript mà không cần khai báo `@map("tên_cột")` riêng lẻ cho từng trường trong Prisma, giúp code ngắn gọn và hiệu năng cao hơn.
*   **Ví dụ**: `minimumStock`, `requiredQuantity`, `unitPrice`, `createdAt`, `deletedAt`.

### 1.3. Khóa ngoại (Foreign Keys)
*   **Định dạng**: `fk_[tên_bảng_nguồn]_[tên_bảng_đích]_[tên_cột_khóa_ngoại]`
*   **Nguyên tắc**: Sử dụng chữ thường, snake_case. Nếu Prisma tự động sinh khóa ngoại, giữ nguyên tên mặc định. Trong trường hợp viết script SQL raw hoặc migrate thủ công, bắt buộc đặt tên theo chuẩn này.
*   **Ví dụ**: `fk_inventory_transaction_items_inventory_items_inventoryItemId`.

### 1.4. Chỉ mục Hợp phần (Composite Indexes)
*   **Định dạng**: `[tên_bảng]_[các_trường_kết_hợp_viết_snake]_[idx]` hoặc `[tên_bảng]_[mục_tiêu_nghiệp_vụ]_[idx]`.
*   **Nguyên tắc**: Bắt buộc đặt tên rõ ràng thông qua thuộc tính `map: "tên_chỉ_mục"` trong Prisma để thuận tiện cho việc giám sát hiệu năng (Query Profiling) và phân tích `EXPLAIN`.
*   **Ví dụ thực tế**:
    *   Chỉ mục theo dõi tồn kho vị trí: `inventory_location_stocks_item_bucket_idx` (được định nghĩa tại [schema.prisma:L999](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L999)).
    *   Chỉ mục truy vấn lịch sử giao dịch: `inventory_transactions_projectId_transactionDate_idx` (được định nghĩa tại [schema.prisma:L942](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L942)).

### 1.5. Bảng Snapshots & Read Models
*   **Snapshots Table**: Lưu dữ liệu tính toán sẵn (pre-computed JSON payload) cho các dashboard hoặc ngăn chi tiết. Định dạng: `[tên_phân_hệ]_[tên_nghiệp_vụ]_snapshots`.
    *   Ví dụ: [inventory_material_snapshots](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1696), [project_dashboard_snapshots](file:///opt/projects/steeltrack/apps/backend-api/prisma/schema.prisma#L1746).
*   **Read Model Table**: Bảng phẳng lưu trạng thái đọc tối ưu hóa. Định dạng: `[tên_phân_hệ]_[tên_nghiệp_vụ]_read_models` hoặc `[tên_phân_hệ]_[tên_nghiệp_vụ]_views`.

---

## 2. Quy chuẩn Lớp Repository (Repositories Conventions)

Lớp Repository chịu trách nhiệm đóng gói toàn bộ câu lệnh truy vấn Prisma của một thực thể hoặc một nhóm thực thể liên quan chặt chẽ (Aggregate Root).

### 2.1. Đặt tên File & Thư mục
*   **Thư mục**: `apps/backend-api/src/modules/[module_name]/repositories/`
*   **Tên File**: kebab-case kèm hậu tố `.repository.ts`.
    *   Ví dụ: `inventory.repository.ts`, `production.repository.ts`, `projects.repository.ts`.

### 2.2. Đặt tên Class
*   **Định dạng**: PascalCase kèm hậu tố `Repository`.
    *   Ví dụ: `InventoryRepository`, `ProductionRepository`, `ProjectsRepository`.

### 2.3. Đặt tên Phương thức (Method Naming)
*   **Truy vấn đọc (Queries)**:
    *   Lấy một bản ghi theo ID/Unique key: `find[Entity]ById`, `find[Entity]ByCode`. Ví dụ: `findMaterialById(id: string)`.
    *   Lấy danh sách phân trang/bộ lọc: `findMany[Entities]`, `search[Entities]`. Ví dụ: `findManyMaterials(filters: MaterialFilters)`.
    *   Lấy nguồn dữ liệu tổng hợp cho Read Model: `find[Workspace]Sources`. Ví dụ: `findProjectDetailSources(projectId, tab)`.
*   **Ghi dữ liệu (Mutations)**:
    *   Tạo mới: `create[Entity]`. Ví dụ: `createWorkOrder(data: Prisma.WorkOrderCreateInput)`.
    *   Cập nhật: `update[Entity]`. Ví dụ: `updateProjectTask(id: string, data: Prisma.ProjectTaskUpdateInput)`.
    *   Xóa: `delete[Entity]` (nếu xóa vật lý) hoặc `softDelete[Entity]` (nếu xóa logic thông qua cờ `deletedAt`).
*   **Tham số Transaction**: Mọi phương thức thay đổi dữ liệu hoặc có nguy cơ chạy trong transaction của Service bắt buộc phải nhận tham số `db: DbClient` ở cuối (với `DbClient = PrismaService | Prisma.TransactionClient`), mặc định là `this.prisma`.

---

## 3. Quy chuẩn Sự kiện hệ thống (Events Conventions)

Sự kiện hệ thống được phát hành qua Outbox Pattern phục vụ cho việc đồng bộ dữ liệu không đồng bộ (Eventual Consistency) giữa các Bounded Context.

### 3.1. Cấu trúc Tên Sự kiện
Tên sự kiện bắt buộc sử dụng chữ thường, phân cách bằng dấu chấm (dot notation) theo cấu trúc:
```text
[context_name].[entity_name].[action_name]
```
Trong đó:
*   `context_name`: Tên phân hệ sở hữu (ví dụ: `inventory`, `production`, `projects`, `qc`, `logistics`, `yard`).
*   `entity_name`: Tên thực thể dạng kebab-case (ví dụ: `transaction`, `work-order`, `task`, `inspection`, `component`).
*   `action_name`: Hành động ở thời quá khứ (past tense) biểu thị trạng thái đã xảy ra thành công (ví dụ: `created`, `updated`, `released`, `consumed`, `departed`, `received`, `failed`, `passed`).

### 3.2. Ví dụ Danh mục Tên Sự kiện Chuẩn
*   `inventory.transaction.created`: Ghi nhận phiếu nhập/xuất/kho thành công.
*   `inventory.return.received`: Tiếp nhận vật tư thu hồi từ dự án về kho.
*   `production.work-order.released`: Lệnh sản xuất được duyệt phát hành.
*   `production.material.consumed`: Báo cáo tiêu hao vật tư tại tổ máy.
*   `qc.inspection.failed`: Kiểm định chất lượng không đạt (sinh NCR).
*   `projects.task.progress-updated`: Tiến độ công việc WBS tại công trường thay đổi.
*   `logistics.dispatch.departed`: Xe chở cấu kiện xuất phát từ bãi.

---

## 4. Quy chuẩn Snapshots (Snapshots Conventions)

Snapshots là các bản ghi dữ liệu tổng hợp dạng JSON lưu trữ trong database để tối ưu hóa hiệu năng đọc của Client.

### 4.1. Đặt tên Class & Interface
*   **Class/Type đại diện cho bảng**: PascalCase kèm hậu tố `Snapshot`. Ví dụ: `InventoryDashboardSnapshot`, `ProjectRuntimeSnapshot`.
*   **Interface của Payload JSON**: `[ModuleName][ConceptName]SnapshotPayload`. Ví dụ: `InventoryMaterialSnapshotPayload`.

### 4.2. Khóa đệm Snapshot (Cache Key Format)
Khi snapshot được lưu tạm hoặc lập chỉ mục trong Redis/In-Memory Cache, khóa đệm phải tuân thủ định dạng phân tầng bằng dấu hai chấm, viết thường:
```text
[context_name]:[concept_name]:[scope_id_or_date]
```
*   Ví dụ:
    *   Cache chi tiết vật tư: `inventory:material:item_steel_h10_001`
    *   Cache bảng điều khiển dự án: `projects:dashboard:proj_complex_steel_01`
    *   Cache tổng quan kho: `dashboard:inventory:summary`

---

## 5. Phân bản hệ thống (Versioning Conventions)

Để quản lý sự tiến hóa của dữ liệu và cấu trúc sự kiện trong môi trường doanh nghiệp quy mô lớn, SteelTrack áp dụng quy tắc phân bản chặt chẽ:

### 5.1. Phân bản Thực thể (Entity/Data Versioning)
*   **Kiểm soát xung đột đồng thời (Optimistic Concurrency Control - OCC)**:
    *   Mọi bảng chứa dữ liệu nghiệp vụ quan trọng dễ xảy ra ghi đè đồng thời (như `inventory_location_stocks`, `project_tasks`) phải bao gồm trường `version` kiểu `Int` mặc định là `1`.
    *   Khi cập nhật, câu lệnh SQL bắt buộc phải kiểm tra điều kiện:
        ```sql
        UPDATE table_name SET version = version + 1, ... WHERE id = :id AND version = :current_version;
        ```
    *   Trong Prisma: Sử dụng middleware hoặc thực thi ghi đè thủ công để kiểm soát cập nhật phiên bản.
*   **Audit Trail**: Mọi thực thể nghiệp vụ phải có ít nhất 3 trường: `createdAt` (DateTime), `updatedAt` (DateTime), và `deletedAt` (DateTime?, hỗ trợ soft-delete).

### 5.2. Phân bản Sự kiện (Event Versioning)
*   **Metadata Phiên bản Payload**:
    *   Mỗi payload sự kiện gửi đi bắt buộc chứa trường `version` (kiểu số nguyên, bắt đầu từ `1`) trong phần body hoặc phần metadata để Consumer biết cách giải mã.
*   **Thay đổi không tương thích (Breaking Changes)**:
    *   *Trường hợp Thêm trường mới (Non-breaking)*: Tăng phiên bản payload lên ví dụ từ `1` lên `2` nhưng vẫn giữ nguyên tên sự kiện. Consumer cũ bỏ qua trường mới, Consumer mới sẽ đọc trường mới.
    *   *Trường hợp Đổi tên/Xóa trường (Breaking)*: Bắt buộc phải phát hành sự kiện mới có chứa ký tự phiên bản lớn trong đường dẫn tên sự kiện.
        *   Ví dụ sự kiện gốc: `inventory.transaction.created` (mặc định hiểu là v1).
        *   Sự kiện có cấu trúc payload thay đổi hoàn toàn: `inventory.transaction.v2.created`.
    *   Hạ tầng Event Bus hỗ trợ định tuyến đồng thời cả hai phiên bản sự kiện trong thời gian chuyển tiếp (Deprecation Period) trước khi gỡ bỏ hoàn toàn phiên bản cũ.
