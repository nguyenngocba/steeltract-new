# Enterprise Runtime & Telemetry Guidelines (EPIC210)

Hướng dẫn giám sát hiệu năng thời gian thực (Runtime Metrics) và xử lý sự cố hiệu năng trong hệ thống SteelTrack. Hạ tầng này được xây dựng trong không gian [core/performance](file:///opt/projects/steeltrack/apps/backend-api/src/core/performance/) để đo lường tự động tài nguyên CPU, bộ nhớ, thời gian truy vấn SQL và lưu lượng API.

---

## 1. Cơ chế Đo lường Hiệu năng (Telemetry Mechanisms)

SteelTrack sử dụng 4 cơ chế đo lường tích hợp sẵn trong nền tảng:

1.  **HTTP Runtime Interceptor**: Đo lường toàn bộ thời gian phản hồi của các HTTP API Endpoints và phân loại theo mã trạng thái HTTP (2xx, 3xx, 4xx, 5xx).
2.  **Prisma Query Event Profiler**: Phân tích SQL sinh ra bởi Prisma. Ghi nhận thời điểm thực thi và log cảnh báo nếu thời gian chạy vượt ngưỡng an toàn.
3.  **Query Budget Enforcement**: Thiết lập định biên số lượng câu lệnh SQL tối đa và thời gian chạy tối đa cho một Request nghiệp vụ.
4.  **Slow Query Detector**: Ghi vết các câu truy vấn chậm vào tệp tin `docs/runtime/slow-query.log`.

---

## 2. Chỉ tiêu SLO Hiệu năng (Service Level Objectives)

Mọi chức năng phát triển mới đều phải vượt qua bài kiểm tra chất lượng hiệu năng (Performance Gate) với các chỉ số cam kết sau:

| Chỉ số (Metric) | Giá trị SLO mục tiêu | Hành động nếu vi phạm (Violation Action) |
| --- | --- | --- |
| **Độ trễ API (API Latency - p95)** | `< 200ms` | Báo động trên Operations Center. Yêu cầu chuyển đổi sang mô hình đọc Snapshot. |
| **Độ trễ truy vấn DB (DB Latency - p95)**| `< 50ms` | Tự động log vào `slow-query.log`. Bắt buộc phân tích EXPLAIN kế hoạch truy cập PostgreSQL. |
| **Ngân sách Truy vấn (Query Budget)** | `< 10 queries/req` | Ném cảnh báo `queries.nPlusOneWarnings` trong log. Bắt buộc tối ưu hóa nạp dữ liệu (Eager loading). |
| **Bộ nhớ Tiến trình (Process RSS Heap)** | `< 512MB` | Kích hoạt GC thủ công hoặc phát lệnh restart container nếu vượt ngưỡng 1GB để tránh rò rỉ bộ nhớ. |

---

## 3. Tích hợp Code Đo lường & Logging

### 3.1. Thiết lập Ngân sách Truy vấn (Query Budget) cho Controller
Sử dụng Decorator `@QueryBudget` để giới hạn cứng số lượng câu lệnh SQL được phép chạy:

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { QueryBudgetInterceptor } from '../../core/performance/interceptors/query-budget.interceptor';
import { QueryBudget } from '../../core/performance/decorators/query-budget.decorator';

@Controller('dashboard')
@UseInterceptors(QueryBudgetInterceptor)
export class DashboardController {
  
  @Get('cockpit')
  @QueryBudget({ maxQueries: 5, maxDurationMs: 150 }) // Vượt quá sẽ kích hoạt cảnh báo hệ thống
  async getCockpitData() {
    return this.dashboardService.getSummary();
  }
}
```

### 3.2. Cấu hình Prisma Logger Profiler
Trong [PrismaService](file:///opt/projects/steeltrack/apps/backend-api/src/core/prisma/prisma.service.ts), đăng ký lắng nghe sự kiện truy vấn và đo đếm thời gian:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  onModuleInit() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (this as any).$on('query', (e: any) => {
      const duration = Number(e.duration);
      if (duration > 50) { // Cảnh báo Slow Query > 50ms
        console.warn(`[SLOW QUERY] SQL: ${e.query} | Duration: ${duration}ms`);
      }
    });
  }
}
```

---

## 4. Quy trình Khắc phục Truy vấn Chậm (Slow Query Remediation)

Khi hệ thống Operations Center báo động có truy vấn vượt SLO:

1.  **Trích xuất SQL**: Lấy câu lệnh SQL thực tế chạy chậm từ tệp log `docs/runtime/slow-query.log`.
2.  **Khởi chạy EXPLAIN**: Chạy lệnh `EXPLAIN (ANALYZE, BUFFERS)` trực tiếp trên PostgreSQL để kiểm tra kế hoạch thực thi (Execution Plan).
3.  **Đánh giá Index**:
    *   Nếu phát hiện `Seq Scan` (quét toàn bảng) trên bảng lớn: Bắt buộc tạo Index thích hợp.
    *   Nếu truy vấn lọc theo nhiều điều kiện đồng thời: Tạo composite index theo thứ tự cột từ có độ chọn lọc cao (high cardinality) đến thấp.
4.  **Tái cấu trúc**: Nếu index không giải quyết được vấn đề (do dữ liệu gộp quá lớn), tiến hành chuyển đổi sang sử dụng **Persisted Snapshot** theo đúng tài liệu [persisted-snapshot-architecture.md](file:///opt/projects/steeltrack/docs/architecture/persisted-snapshot-architecture.md).
