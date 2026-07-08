# Chuẩn Thiết kế API REST (Enterprise API Contracts) - EPIC210

Tài liệu này quy định chuẩn thiết kế giao diện lập trình ứng dụng REST API (API Contracts) cho toàn bộ hệ thống **SteelTrack**. Các quy tắc dưới đây nhằm đảm bảo tính đồng nhất, an toàn, dễ bảo trì và tối ưu hóa băng thông truyền tải dữ liệu giữa Frontend và Backend.

---

## 1. Nguyên tắc Thiết kế REST (REST Naming Standards)

SteelTrack thiết kế API theo định hướng tài nguyên (Resource-Oriented Design):

*   **Cấu trúc URL**: Sử dụng chữ thường, số nhiều, kebab-case cho các tài nguyên.
    *   Định dạng chuẩn: `/api/v1/[resource-name]`
    *   Ví dụ: `/api/v1/inventory-items`, `/api/v1/dispatch-orders`.
*   **Sub-resources (Tài nguyên phụ thuộc)**: Biểu thị mối quan hệ cha-con rõ ràng.
    *   Ví dụ: Lấy các task của một dự án cụ thể: `/api/v1/projects/:projectId/tasks`.
*   **HTTP Methods & Ánh xạ Hành động**:
    *   `GET`: Đọc tài nguyên (Đảm bảo idempotent, không thay đổi dữ liệu).
    *   `POST`: Tạo mới tài nguyên hoặc kích hoạt một hành động nghiệp vụ phức tạp (ví dụ: `/api/v1/projects/:id/wbs/generate`).
    *   `PATCH`: Cập nhật một phần dữ liệu của tài nguyên (Luôn ưu tiên sử dụng thay vì `PUT`).
    *   `DELETE`: Xóa tài nguyên (Thông thường là soft-delete, cập nhật trường `deletedAt`).

---

## 2. Các tham số truy vấn chung (Common Query Parameters)

### 2.1. Phân trang (Pagination)
Mọi API truy vấn danh sách (Query Pattern) bắt buộc phải hỗ trợ phân trang để ngăn chặn tràn bộ nhớ và quá tải database.
*   `page`: Vị trí trang cần lấy (Bắt đầu từ `1`, mặc định `1`).
*   `limit`: Số lượng bản ghi trên một trang (Mặc định `10`, tối đa `100`).
*   *Ví dụ truy cập*: `GET /api/v1/inventory-items?page=2&limit=25`

### 2.2. Bộ lọc (Filtering)
*   **Lọc đơn giản**: Gửi trực tiếp tên trường và giá trị mong muốn.
    *   Ví dụ: `GET /api/v1/projects?status=ACTIVE`
*   **Lọc nâng cao (Toán tử)**: Sử dụng cấu trúc cặp ngoặc vuông biểu thị toán tử so sánh (`gte`, `lte`, `like`, `in`).
    *   Ví dụ lọc số lượng tồn kho >= 10: `GET /api/v1/inventory-items?quantity[gte]=10`
    *   Ví dụ lọc danh sách dự án thuộc một trong các trạng thái: `GET /api/v1/projects?status[in]=ACTIVE,PLANNING`
    *   Ví dụ lọc tìm kiếm tương đối: `GET /api/v1/inventory-items?code[like]=STEEL-H`

### 2.3. Sắp xếp (Sorting)
*   `sortBy`: Tên trường dữ liệu dùng để sắp xếp (mặc định: `createdAt`).
*   `sortOrder`: Chiều sắp xếp, chỉ chấp nhận `asc` (tăng dần) hoặc `desc` (giảm dần) (mặc định: `desc`).
*   *Ví dụ truy cập*: `GET /api/v1/dispatch-orders?sortBy=deliveryDate&sortOrder=asc`

---

## 3. Cấu trúc Payload trả về (API Envelope Structure)

Hệ thống bắt buộc trả về dữ liệu đóng gói trong một cấu trúc bao đóng (envelope) thống nhất.

### 3.1. Phản hồi Thành công (Success Envelope)
*   HTTP Status Code: `200 OK` (cho các truy vấn đọc, cập nhật) hoặc `201 Created` (cho các truy vấn tạo mới).
*   Cấu trúc JSON:
```json
{
  "success": true,
  "data": { ... } // Có thể là Object hoặc Array tùy thuộc API
}
```

### 3.2. Phản hồi Thất bại (Failure Envelope)
*   HTTP Status Code: `4xx` hoặc `5xx` tùy thuộc loại lỗi.
*   Cấu trúc JSON:
```json
{
  "success": false,
  "error": {
    "code": "MÃ_LỖI_HỆ_THỐNG",
    "message": "Thông báo lỗi chi tiết bằng tiếng Việt cho người dùng",
    "details": null // Hoặc mảng chi tiết lỗi (ví dụ lỗi validation)
  }
}
```

---

## 4. Định dạng Lỗi xác thực (Zod Validation Errors)

Khi dữ liệu đầu vào không vượt qua bộ lọc Zod Schema, hệ thống phải trả về mã HTTP `400 Bad Request` kèm theo chi tiết các trường bị lỗi như sau:

*   **Mã lỗi**: `VALIDATION_ERROR`
*   **Mảng `details`**: Chứa danh sách các trường không hợp lệ, bao gồm đường dẫn trường (`field`) và thông điệp lỗi (`message`).

*   **Ví dụ Payload lỗi xác thực**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu yêu cầu gửi lên không hợp lệ.",
    "details": [
      {
        "field": "quantity",
        "message": "Số lượng yêu cầu sản xuất phải là số dương lớn hơn 0"
      },
      {
        "field": "bomItems.0.inventoryItemId",
        "message": "Mã vật tư BOM liên kết không được để trống"
      }
    ]
  }
}
```

---

## 5. Các Mẫu API Tiêu chuẩn (Standard API Pattern Templates)

Hệ thống SteelTrack chuẩn hóa dữ liệu trả về theo 5 mẫu API cốt lõi:

### 5.1. Mẫu API Thay đổi dữ liệu (Mutation Pattern - POST/PATCH/DELETE)
*   **Mô tả**: Trả về dữ liệu tối giản bao gồm ID của thực thể được tác động để tối ưu hóa hiệu năng, kèm theo timestamp.
*   **Ví dụ phản hồi (`POST /api/v1/production/work-orders`)**:
```json
{
  "success": true,
  "data": {
    "id": "wo_clx91ijkl0003prod",
    "workOrderNo": "WO-260708-00001",
    "createdAt": "2026-07-08T16:21:06.000Z"
  }
}
```

### 5.2. Mẫu API Danh sách Phân trang (Query/List Pattern - GET)
*   **Mô tả**: Trả về mảng dữ liệu trong thuộc tính `data` kèm theo metadata phân trang `meta` ở cùng cấp.
*   **Ví dụ phản hồi (`GET /api/v1/inventory-items?page=1&limit=10`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "item_steel_h10_001",
      "code": "STEEL-H10",
      "name": "Thép hình H10",
      "quantity": 152.5,
      "unit": "Tấn"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

### 5.3. Mẫu API Chi tiết (Detail Pattern - GET)
*   **Mô tả**: Trả về toàn bộ các trường thông tin của một thực thể, có thể bao gồm các mối quan hệ mức 1 (nested objects) để phục vụ cho các Drawer hoặc trang chi tiết.
*   **Ví dụ phản hồi (`GET /api/v1/projects/proj_complex_steel_01`)**:
```json
{
  "success": true,
  "data": {
    "id": "proj_complex_steel_01",
    "code": "PROJ-HADO-2026",
    "name": "Tổ hợp nhà thép Hà Đô",
    "status": "ACTIVE",
    "contractValue": 12500000000.00,
    "startDate": "2026-07-01T00:00:00.000Z",
    "endDate": "2026-12-31T23:59:59.000Z",
    "manager": {
      "id": "usr_mgr_99",
      "fullName": "Trần Văn B"
    }
  }
}
```

### 5.4. Mẫu API Bảng điều khiển (Dashboard/Analytics Pattern - GET)
*   **Mô tả**: Trả về cấu trúc dữ liệu phẳng hóa, phân loại rõ ràng các chỉ số KPI chính và dữ liệu vẽ biểu đồ, thường đọc từ các bảng Snapshot.
*   **Ví dụ phản hồi (`GET /api/v1/dashboard/inventory`)**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalStockQty": 1850.4,
      "totalStockValue": 34225000000.0,
      "lowStockCount": 12,
      "outOfStockCount": 2
    },
    "charts": {
      "dailyMovements": [
        { "date": "2026-07-07", "inbound": 45.2, "outbound": 30.1 },
        { "date": "2026-07-08", "inbound": 12.5, "outbound": 18.2 }
      ],
      "categoryDistribution": [
        { "categoryName": "Thép hình", "percentage": 65.5 },
        { "categoryName": "Thép tấm", "percentage": 34.5 }
      ]
    }
  }
}
```

### 5.5. Mẫu API Tìm nhanh (Lookup/Dropdown Pattern - GET)
*   **Mô tả**: Trả về danh sách cực kỳ tối giản (chỉ chứa `id`, `code`, `name` hoặc trường mô tả ngắn) phục vụ cho các ô Select/Combobox tìm kiếm nhanh ở Frontend mà không làm ảnh hưởng đến băng thông.
*   **Ví dụ phản hồi (`GET /api/v1/inventory-items/lookup?q=steel`)**:
```json
{
  "success": true,
  "data": [
    { "id": "item_steel_h10_001", "code": "STEEL-H10", "name": "Thép hình H10" },
    { "id": "item_steel_h20_002", "code": "STEEL-H20", "name": "Thép hình H20" }
  ]
}
```
