# Projects Domain Models & Repositories

Tài liệu này chi tiết hóa các thực thể (Entities), mối quan hệ (Relationships), các quy tắc ràng buộc dữ liệu (Validations) và thiết kế Repository lớp dữ liệu cho phân hệ Quản lý Dự án (PMS).

---

## 1. Domain Entities & Database Schema Design

Kiến trúc thực thể cơ sở dữ liệu của PMS được thiết kế xoay quanh cấu trúc cây công việc (WBS) phân cấp, kết hợp phân bổ vật tư, cấu kiện, tài nguyên và kiểm soát chi phí chi tiết.

```mermaid
erDiagram
    PROJECT ||--o{ PROJECT_TASK : contains
    PROJECT ||--o{ COMPONENT : assigns
    PROJECT ||--o{ INVENTORY_TRANSACTION : executes
    PROJECT ||--o{ RETURN_REQUEST : records
    PROJECT ||--o? PROJECT_DASHBOARD_SNAPSHOT : maintains
    
    PROJECT_TASK ||--o{ PROJECT_TASK_DEPENDENCY : requires
    PROJECT_TASK ||--o{ PROJECT_TASK_MATERIAL_ALLOCATION : allocates_material
    PROJECT_TASK ||--o{ PROJECT_TASK_COMPONENT_ALLOCATION : allocates_component
    PROJECT_TASK ||--o{ PROJECT_TASK_RESOURCE : uses
    PROJECT_TASK ||--o? PROJECT_TASK_INSPECTION : QC_verifies
    PROJECT_TASK ||--o? PROJECT_TASK_COST : tracks_cost
    
    PROJECT_TASK_MATERIAL_ALLOCATION }|--|| INVENTORY_ITEM : references
    PROJECT_TASK_COMPONENT_ALLOCATION }|--|| COMPONENT : references
```

### 1.1. Project (Dự án - Đã có trong Schema)
Đơn vị quản lý cao nhất của dự án kết cấu thép.
- `id`: String (CUID, PK)
- `code`: String (Unique, định dạng `PROJ-YYYY-XXXX`)
- `name`: String (Tên công trình/dự án)
- `description`: String (Mô tả dự án, nullable)
- `status`: ProjectStatus (`PLANNING`, `ACTIVE`, `SUSPENDED`, `COMPLETED`, `CANCELLED`)
- `createdAt`, `updatedAt`: DateTime

### 1.2. ProjectTemplate (Mẫu dự án - Đã có trong Schema)
Thư viện lưu trữ các mẫu cấu trúc WBS và định mức chuẩn cho các loại công trình (ví dụ: Nhà xưởng 2 nhịp, Nhà cao tầng).
- `id`: String (CUID, PK)
- `code`: String (Unique)
- `name`: String
- `structure`: Json (Lưu thông tin định mức, checklist, cấu trúc cây mẫu)
- `status`: ProjectTemplateStatus (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
- `isDefault`: Boolean

### 1.3. ProjectTask (Công việc Dự án - Đã có trong Schema)
Một nút (node) trong cây WBS phân cấp. Có thể là một hạng mục cha (Summary Task) hoặc một đầu việc cụ thể (Leaf Task).
- `id`: String (CUID, PK)
- `projectId`: String (FK liên kết với `Project`)
- `parentTaskId`: String (FK liên kết đệ quy đến `ProjectTask` cha, nullable)
- `name`: String (Tên công việc, ví dụ: "Lắp đặt cột trục A-B")
- `description`: String (nullable)
- `status`: ProjectTaskStatus (`PLANNED`, `READY`, `IN_PROGRESS`, `QC_PENDING`, `COMPLETED`, `BLOCKED`)
- `progress`: Float (Tiến độ thực tế, từ `0` đến `100.0`)
- `plannedStartAt`, `plannedFinishAt`: DateTime (Lịch trình kế hoạch ban đầu)
- `scheduledStartAt`, `scheduledFinishAt`: DateTime (Lịch trình chạy động do dependency gợi ý)
- `actualStartAt`, `actualFinishAt`: DateTime (Thời gian thực tế ghi nhận từ hiện trường)
- `forecastFinishAt`: DateTime (Thời gian hoàn thành dự báo)
- `baselineStartAt`, `baselineFinishAt`: DateTime (Lịch trình cơ sở để so sánh sai lệch)
- `cascadeDelayDays`: Int (Độ trễ tích lũy từ các task trước lan truyền sang)
- `baselineVarianceDays`: Int (Sai lệch ngày hoàn thành thực tế/dự báo so với baseline)
- `sortOrder`: Int (Thứ tự hiển thị trên cây)

### 1.4. ProjectTaskDependency (Mối quan hệ phụ thuộc - Đã có trong Schema)
Định nghĩa liên kết phụ thuộc giữa các task trong WBS để phục vụ thuật toán đường găng (Critical Path).
- `id`: String (CUID, PK)
- `projectTaskId`: String (FK task đích - người đi sau)
- `dependsOnTaskId`: String (FK task nguồn - người đi trước)
- `type`: ProjectTaskDependencyType (`FS` - Finish to Start, `SS` - Start to Start, `FF` - Finish to Finish, `SF` - Start to Finish)
- `lagDays`: Int (Khoảng nghỉ, mặc định `0`)

### 1.5. ProjectTaskMaterialAllocation (Phân bổ vật tư - Đã có trong Schema)
Định mức vật tư thép tấm/thép hình/bulong cần thiết cho task.
- `id`: String (CUID, PK)
- `projectTaskId`: String (FK)
- `inventoryItemId`: String (FK liên kết với danh mục vật tư kho)
- `plannedQty`: Float (Số lượng định mức kế hoạch)
- `issuedQty`: Float (Số lượng thực tế đã xuất kho cấp phát)
- `usedQty`: Float (Số lượng đã lắp dựng/tiêu hao thực tế)
- `returnedQty`: Float (Số lượng thừa đã hoàn trả về kho)
- `remainingQty`: Float (Số lượng còn lại cần xuất kho = `plannedQty` - `issuedQty` + `returnedQty`)
- `unitCost`: Float (Giá đơn vị vật tư tại thời điểm phân bổ)
- `totalCost`: Float (Tổng chi phí vật tư dự kiến = `plannedQty` * `unitCost`)

### 1.6. ProjectTaskComponentAllocation (Phân bổ cấu kiện - Đã có trong Schema)
Danh sách các cấu kiện cụ thể cần lắp dựng cho task này.
- `id`: String (CUID, PK)
- `projectTaskId`: String (FK)
- `componentId`: String (FK liên kết cấu kiện cụ thể có serial/mã cấu kiện từ MES)
- `status`: ProjectTaskComponentStatus (`NOT_STARTED`, `IN_TRANSIT`, `DELIVERED`, `INSTALLED`, `RETURNED`)
- `cost`: Float (Chi phí cấu kiện)
- `assignedAt`, `installedAt`, `returnedAt`: DateTime (nullable)

### 1.7. ProjectTaskResource (Phân bổ tài nguyên nhân công/máy thi công - Đã có trong Schema)
- `id`: String (CUID, PK)
- `projectTaskId`: String (FK)
- `type`: ProjectTaskResourceType (`WORKER_GROUP`, `CRANE_EQUIPMENT`, `SUPERVISOR`)
- `name`: String (Ví dụ: "Tổ lắp dựng số 1", "Xe cẩu Kato 50T")
- `quantity`: Float (Số lượng yêu cầu định mức)
- `allocatedQuantity`: Float (Số lượng thực tế đã điều động)
- `cost`: Float (Đơn giá/chi phí phân bổ nguồn lực)

### 1.8. ProjectTaskInspection (QC Nghiệm thu công trường - Đã có trong Schema)
- `id`: String (CUID, PK)
- `projectTaskId`: String (FK, Unique)
- `status`: ProjectTaskInspectionStatus (`PENDING_INSPECTION`, `PASSED`, `FAILED`, `HANDOVER_COMPLETED`)
- `inspectionDate`, `acceptedDate`, `handoverDate`: DateTime (nullable)
- `remarks`: String (nullable)

### 1.9. ProjectTaskCost (Theo dõi chi phí Task - Đã có trong Schema)
- `id`: String (CUID, PK)
- `projectTaskId`: String (FK, Unique)
- `materialCost`: Float (Chi phí vật tư thực tế lũy kế)
- `laborCost`: Float (Chi phí nhân công thực tế lũy kế)
- `machineCost`: Float (Chi phí máy thi công thực tế lũy kế)
- `otherCost`: Float (Chi phí phát sinh khác)
- `budgetCost`: Float (Ngân sách dự toán cho task)
- `actualCost`: Float (Tổng chi phí thực tế = `materialCost` + `laborCost` + `machineCost` + `otherCost`)
- `forecastCost`: Float (Dự báo chi phí khi hoàn thành)

---

## 2. Repository Layer Boundary Design

Toàn bộ các câu truy vấn phức tạp của phân hệ PMS phải được bọc trong `ProjectsRepository` tại [projects.repository.ts](file:///opt/projects/steeltrack/apps/backend-api/src/modules/projects/repositories/projects.repository.ts). Không cho phép gọi trực tiếp `prismaClient` từ Services.

Dưới đây là các signature TypeScript cụ thể:

```typescript
// Định nghĩa interfaces dùng trong Repository
export interface CreateTaskDto {
  projectId: string;
  parentTaskId?: string;
  name: string;
  description?: string;
  plannedStartAt?: Date;
  plannedFinishAt?: Date;
  sortOrder?: number;
  dependencies?: Array<{ dependsOnTaskId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lagDays?: number }>;
  materials?: Array<{ inventoryItemId: string; plannedQty: number; unitCost: number }>;
  components?: Array<{ componentId: string; cost: number }>;
  resources?: Array<{ type: 'WORKER_GROUP' | 'CRANE_EQUIPMENT' | 'SUPERVISOR'; name: string; quantity: number; cost: number }>;
}

export interface UpdateTaskDto {
  name?: string;
  description?: string;
  status?: 'PLANNED' | 'READY' | 'IN_PROGRESS' | 'QC_PENDING' | 'COMPLETED' | 'BLOCKED';
  progress?: number;
  scheduledStartAt?: Date;
  scheduledFinishAt?: Date;
  actualStartAt?: Date;
  actualFinishAt?: Date;
  forecastFinishAt?: Date;
  cascadeDelayDays?: number;
  baselineVarianceDays?: number;
}

// Khai báo lớp ProjectsRepository mở rộng với các API nghiệp vụ chính xác
@Injectable()
export class ProjectsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  // ... (Các phương thức CRUD Project, findProjectDetailSources và findRuntimeSources đã có sẵn)

  /**
   * Tạo một ProjectTask mới trong Transaction, tự động khởi tạo Cost, Inspection, 
   * phân bổ tài nguyên và ghi nhận Outbox event.
   */
  async createTask(dto: CreateTaskDto, db: DbClient = this.prisma): Promise<any> {
    return db.$transaction(async (tx) => {
      const task = await tx.projectTask.create({
        data: {
          projectId: dto.projectId,
          parentTaskId: dto.parentTaskId,
          name: dto.name,
          description: dto.description,
          plannedStartAt: dto.plannedStartAt,
          plannedFinishAt: dto.plannedFinishAt,
          scheduledStartAt: dto.plannedStartAt,
          scheduledFinishAt: dto.plannedFinishAt,
          sortOrder: dto.sortOrder ?? 0,
          cost: {
            create: {
              budgetCost: (dto.materials?.reduce((acc, m) => acc + (m.plannedQty * m.unitCost), 0) || 0) +
                          (dto.components?.reduce((acc, c) => acc + c.cost, 0) || 0) +
                          (dto.resources?.reduce((acc, r) => acc + r.cost, 0) || 0)
            }
          },
          inspection: {
            create: {
              status: 'PENDING_INSPECTION'
            }
          }
        }
      });

      // Tạo dependencies nếu có
      if (dto.dependencies && dto.dependencies.length > 0) {
        await tx.projectTaskDependency.createMany({
          data: dto.dependencies.map(d => ({
            projectTaskId: task.id,
            dependsOnTaskId: d.dependsOnTaskId,
            type: d.type,
            lagDays: d.lagDays ?? 0
          }))
        });
      }

      // Tạo phân bổ vật tư
      if (dto.materials && dto.materials.length > 0) {
        await tx.projectTaskMaterialAllocation.createMany({
          data: dto.materials.map(m => ({
            projectTaskId: task.id,
            inventoryItemId: m.inventoryItemId,
            plannedQty: m.plannedQty,
            unitCost: m.unitCost,
            totalCost: m.plannedQty * m.unitCost,
            remainingQty: m.plannedQty
          }))
        });
      }

      // Tạo phân bổ cấu kiện
      if (dto.components && dto.components.length > 0) {
        await tx.projectTaskComponentAllocation.createMany({
          data: dto.components.map(c => ({
            projectTaskId: task.id,
            componentId: c.componentId,
            cost: c.cost,
            status: 'NOT_STARTED'
          }))
        });
      }

      // Tạo phân bổ nguồn lực
      if (dto.resources && dto.resources.length > 0) {
        await tx.projectTaskResource.createMany({
          data: dto.resources.map(r => ({
            projectTaskId: task.id,
            type: r.type,
            name: r.name,
            quantity: r.quantity,
            cost: r.cost
          }))
        });
      }

      // Ghi Outbox Event atomically
      await tx.outboxEvent.create({
        data: {
          id: `evt_proj_task_created_${task.id}_${Date.now()}`,
          eventType: 'projects.task.created',
          aggregateType: 'ProjectTask',
          aggregateId: task.id,
          payload: JSON.stringify({
            taskId: task.id,
            projectId: task.projectId,
            parentTaskId: task.parentTaskId,
            name: task.name
          })
        }
      });

      return task;
    });
  }

  /**
   * Cập nhật thông tin task, hỗ trợ cập nhật động tiến độ/ngày tháng,
   * tự động chèn Outbox event để Background Engine kích hoạt tính toán lại schedule.
   */
  async updateTask(taskId: string, dto: UpdateTaskDto, db: DbClient = this.prisma): Promise<any> {
    return db.$transaction(async (tx) => {
      const originalTask = await tx.projectTask.findUnique({
        where: { id: taskId },
        select: { projectId: true, progress: true, scheduledStartAt: true, scheduledFinishAt: true }
      });

      if (!originalTask) throw new Error(`Task with ID ${taskId} not found`);

      const updatedTask = await tx.projectTask.update({
        where: { id: taskId },
        data: {
          ...dto,
          actualStartAt: dto.progress && dto.progress > 0 && !dto.actualStartAt ? new Date() : dto.actualStartAt,
          actualFinishAt: dto.progress === 100 && !dto.actualFinishAt ? new Date() : dto.actualFinishAt
        }
      });

      // Kiểm tra nếu có thay đổi về tiến độ hoặc lịch trình thì phát event Outbox
      const isProgressChanged = dto.progress !== undefined && dto.progress !== originalTask.progress;
      const isScheduleChanged = (dto.scheduledStartAt && dto.scheduledStartAt !== originalTask.scheduledStartAt) ||
                                (dto.scheduledFinishAt && dto.scheduledFinishAt !== originalTask.scheduledFinishAt);

      if (isProgressChanged || isScheduleChanged) {
        await tx.outboxEvent.create({
          data: {
            id: `evt_proj_task_updated_${taskId}_${Date.now()}`,
            eventType: 'projects.task.updated',
            aggregateType: 'ProjectTask',
            aggregateId: taskId,
            payload: JSON.stringify({
              taskId,
              projectId: originalTask.projectId,
              progress: dto.progress,
              scheduledStartAt: dto.scheduledStartAt,
              scheduledFinishAt: dto.scheduledFinishAt,
              triggerRebuild: true
            })
          }
        });
      }

      return updatedTask;
    });
  }

  /**
   * Xóa task và dọn dẹp toàn bộ dữ liệu phụ thuộc trong Transaction.
   */
  async deleteTask(taskId: string, db: DbClient = this.prisma): Promise<void> {
    await db.$transaction(async (tx) => {
      const task = await tx.projectTask.findUnique({ where: { id: taskId }, select: { projectId: true } });
      if (!task) return;

      // Xóa các bảng phụ thuộc cascade thủ công để đảm bảo an toàn nghiệp vụ
      await tx.projectTaskDependency.deleteMany({ where: { OR: [{ projectTaskId: taskId }, { dependsOnTaskId: taskId }] } });
      await tx.projectTaskMaterialAllocation.deleteMany({ where: { projectTaskId: taskId } });
      await tx.projectTaskComponentAllocation.deleteMany({ where: { projectTaskId: taskId } });
      await tx.projectTaskResource.deleteMany({ where: { projectTaskId: taskId } });
      await tx.projectTaskInspection.deleteMany({ where: { projectTaskId: taskId } });
      await tx.projectTaskCost.deleteMany({ where: { projectTaskId: taskId } });
      
      // Xóa task chính
      await tx.projectTask.delete({ where: { id: taskId } });

      // Ghi Outbox Event
      await tx.outboxEvent.create({
        data: {
          id: `evt_proj_task_deleted_${taskId}_${Date.now()}`,
          eventType: 'projects.task.deleted',
          aggregateType: 'ProjectTask',
          aggregateId: taskId,
          payload: JSON.stringify({
            taskId,
            projectId: task.projectId
          })
        }
      });
    });
  }

  /**
   * Cập nhật trạng thái nhận/lắp cấu kiện từ Logistics.
   */
  async updateComponentAllocationStatus(
    allocationId: string,
    status: 'NOT_STARTED' | 'IN_TRANSIT' | 'DELIVERED' | 'INSTALLED' | 'RETURNED',
    db: DbClient = this.prisma
  ): Promise<any> {
    return db.$transaction(async (tx) => {
      const allocation = await tx.projectTaskComponentAllocation.update({
        where: { id: allocationId },
        data: {
          status,
          installedAt: status === 'INSTALLED' ? new Date() : undefined,
          returnedAt: status === 'RETURNED' ? new Date() : undefined
        },
        include: { projectTask: true }
      });

      // Phát sự kiện cập nhật cấu kiện công trường
      await tx.outboxEvent.create({
        data: {
          id: `evt_proj_comp_alloc_${allocationId}_${Date.now()}`,
          eventType: 'projects.allocation.component.updated',
          aggregateType: 'ProjectTaskComponentAllocation',
          aggregateId: allocationId,
          payload: JSON.stringify({
            allocationId,
            taskId: allocation.projectTaskId,
            projectId: allocation.projectTask.projectId,
            componentId: allocation.componentId,
            status
          })
        }
      });

      return allocation;
    });
  }

  /**
   * Ghi nhận nghiệm thu hạng mục công trình.
   */
  async recordInspectionResult(
    taskId: string,
    status: 'PENDING_INSPECTION' | 'PASSED' | 'FAILED' | 'HANDOVER_COMPLETED',
    remarks?: string,
    db: DbClient = this.prisma
  ): Promise<any> {
    return db.$transaction(async (tx) => {
      const inspection = await tx.projectTaskInspection.update({
        where: { projectTaskId: taskId },
        data: {
          status,
          inspectionDate: new Date(),
          acceptedDate: status === 'PASSED' || status === 'HANDOVER_COMPLETED' ? new Date() : undefined,
          handoverDate: status === 'HANDOVER_COMPLETED' ? new Date() : undefined,
          remarks
        },
        include: { projectTask: true }
      });

      // Nếu passed hoặc handover, tự động đẩy progress của task lên 100%
      if (status === 'PASSED' || status === 'HANDOVER_COMPLETED') {
        await tx.projectTask.update({
          where: { id: taskId },
          data: { progress: 100, status: 'COMPLETED', actualFinishAt: new Date() }
        });
      }

      await tx.outboxEvent.create({
        data: {
          id: `evt_proj_inspect_${taskId}_${Date.now()}`,
          eventType: 'projects.inspection.completed',
          aggregateType: 'ProjectTaskInspection',
          aggregateId: inspection.id,
          payload: JSON.stringify({
            taskId,
            projectId: inspection.projectTask.projectId,
            status,
            remarks
          })
        }
      });

      return inspection;
    });
  }
}
```

---

## 3. Phân Tích Rủi Ro Nghiệp Vụ & Kỹ Thuật (Risk & Constraints)

- **Referential Integrity**: Phân bổ cấu kiện (`Component`) chỉ được phép diễn ra khi cấu kiện đó đã được gán vào `projectId` tương ứng. Ràng buộc này được thực thi tại tầng Service trước khi gọi Repository.
- **Cycle Dependency Checks**: WBS không được phép chứa các mối quan hệ phụ thuộc vòng tròn (ví dụ: Task A phụ thuộc Task B, Task B lại phụ thuộc Task A). Lớp Service sử dụng thuật toán DFS (Depth-First Search) để kiểm tra chu kỳ trước khi lưu cập nhật.
- **Negative Allocation Defense**: Số lượng vật tư cấp phát (`issuedQty`) không bao giờ được nhỏ hơn số lượng đã dùng thực tế (`usedQty`). Các hàm nghiệp vụ cập nhật tiêu hao tại hiện trường bắt buộc phải kiểm tra điều kiện này để tránh sai lệch tồn kho dự án.

---

## 4. Giám Sát Operations Center & Runtime Metrics

- **Giám sát Transactions**: Các transaction tạo/sửa WBS cần được gắn tag `module=projects` và đo lường thời gian thực thi. Nếu thời gian chạy transaction vượt quá 200ms, hệ thống ghi nhận một cảnh báo hiệu năng lên Operations Center.
- **Theo dõi Deadlocks**: Do WBS cập nhật cây phác thảo phân cấp lớn, nguy cơ xảy ra Deadlock là có thật. Repository bắt buộc phải bắt lỗi loại P2002/P2034 của Prisma để kích hoạt cơ chế retry của `JobRetryPolicyService`.

---

## 5. Cơ Hội Tích Hợp AI

- **AI Cost & Resource Estimator**: Khi người dùng tải lên danh sách BOQ/BOM dự án, AI tự động phân tích và gán định mức vật tư (`ProjectTaskMaterialAllocation`) và dự toán chi phí (`ProjectTaskCost`) mẫu dựa trên dữ liệu các công trình tương đương trong quá khứ.

---

## 6. Sprint Roadmap

- **Sprint 1**: Tích hợp DB schema và xây dựng các phương thức cơ bản của `ProjectsRepository` (gồm transaction bọc Outbox events).
- **Sprint 2**: Triển khai thuật toán tính toán lại Gantt schedule động và phát hiện dependency cycle bất đồng bộ qua Background Job.
