# Enterprise Software Development Standards (EPIC210)

Bộ quy tắc phát triển phần mềm cốt lõi (Software Development Standards) bắt buộc áp dụng cho toàn bộ kỹ sư phát triển phần mềm tham gia dự án SteelTrack.

---

## 1. Quy định đặt tên (Naming Conventions)

### 1.1. Tập tin & Thư mục (Files & Directories)
*   **Thư mục**: Sử dụng chữ thường, ngăn cách bằng dấu gạch ngang (kebab-case). Ví dụ: `modules/backend-api/src/modules/inventory/`.
*   **Tập tin code (TypeScript/React)**:
    *   Tập tin Component React: Sử dụng PascalCase. Ví dụ: `CockpitKpiCard.tsx`.
    *   Tập tin Service, Controller, Repository: Sử dụng kebab-case kèm hậu tố định danh phân lớp. Ví dụ: `inventory.repository.ts`, `jobs.controller.ts`, `background-job-manager.service.ts`.

### 1.2. Biến, Hàm và Lớp (Code Symbols)
*   **Tên Class**: PascalCase. Ví dụ: `InventoryRepository`.
*   **Hàm & Biến**: camelCase. Ví dụ: `calculateAverageCost()`, `totalAmount`.
*   **Hằng số**: UPPERCASE với gạch dưới. Ví dụ: `JOB_WORKER_POLL_MS`.

---

## 2. Tiêu chuẩn Mã nguồn & Định dạng (Code Formatting)

1.  **TypeScript Strict Mode**:
    *   Không sử dụng kiểu `any` trong bất kỳ đoạn mã mới nào. Mọi biến bắt buộc phải được khai báo kiểu rõ ràng hoặc sử dụng `unknown` nếu chưa rõ nguồn gốc kèm theo ép kiểu an toàn (Zod validation).
    *   Sử dụng `interface` cho cấu trúc dữ liệu mô tả API Contract, và `type` cho các kiểu ghép, enum nội bộ.
2.  **Định dạng tự động (ESLint & Prettier)**:
    *   Dự án cấu hình tự động format code khi lưu file. Quy tắc dấu ngoặc đơn, thụt lề 2 khoảng trắng, không sử dụng dấu chấm phẩy ở cuối dòng nếu cấu hình dự án quy định (tuân thủ tệp `.prettierrc`).
3.  **Clean Code & Nguyên tắc Tách biệt**:
    *   Hạn chế viết các file Component hoặc Service lớn hơn 500 dòng code. Chia nhỏ thành các component con hoặc helper functions trong thư mục `helpers/` hoặc `components/`.

---

## 3. Quy trình Git & Nguyên tắc An toàn (Git Safety Rules)

Để tránh rủi ro mất mát dữ liệu trên môi trường phát triển chung, kỹ sư phải tuân thủ các quy tắc an toàn Git sau:

1.  **Commit Checkpoint trước khi sửa đổi lớn**:
    Trước khi bắt đầu thực hiện một đợt thay đổi lớn về mã nguồn hoặc cấu trúc bảng, phải thực hiện commit checkpoint:
    ```bash
    git add .
    git commit -m "checkpoint: before implementing epic-210 domain standards"
    ```
2.  **Phục hồi khi thất bại (Rollback)**:
    Nếu quá trình triển khai gặp lỗi nghiêm trọng hoặc không vượt qua được bước build xác thực, hãy nhanh chóng phục hồi trạng thái sạch:
    ```bash
    git reset --hard HEAD
    ```
3.  **Hành vi Cấm kỵ (Prohibited Git Actions)**:
    *   Không bao giờ thực hiện các lệnh có tính chất hủy diệt dữ liệu nhánh chung như `git push --force`, `git rebase` trên nhánh `main` hoặc `develop`, hoặc xóa nhánh lịch sử mà không có sự phê duyệt bằng văn bản từ Tech Lead.
4.  **Cú pháp Commit Message**:
    Commit message phải tuân thủ chuẩn Conventional Commits:
    ```text
    feat(inventory): add snapshot rebuilder worker for material detail
    fix(projects): resolve DI unknown dependency in PermissionsGuard
    docs(architecture): write enterprise development guidelines
    ```

---

## 4. Quy trình Nghiệm thu Code (Verification Requirements)

Một tác vụ phát triển phần mềm được coi là hoàn thành (Done) **chỉ khi** vượt qua đầy đủ các bước xác thực sau:

1.  **Thực thi kiểm định Build hệ thống**:
    Chạy lệnh kiểm thử biên dịch độc lập cho cả Frontend và Backend:
    ```bash
    pnpm -C apps/frontend build
    pnpm -C apps/backend-api build
    ```
2.  **Cập nhật tài liệu AI State bắt buộc**:
    Kỹ sư bắt buộc phải cập nhật 4 file tài liệu trạng thái AI sau khi kết thúc task:
    *   [docs/ai-state/CHANGELOG_AI.md](file:///opt/projects/steeltrack/docs/ai-state/CHANGELOG_AI.md) (Ghi chép lịch sử thay đổi).
    *   [docs/ai-state/CURRENT_STATE.md](file:///opt/projects/steeltrack/docs/ai-state/CURRENT_STATE.md) (Cập nhật kiến trúc hiện hành).
    *   [docs/ai-state/PROJECT_STATUS.md](file:///opt/projects/steeltrack/docs/ai-state/PROJECT_STATUS.md) (Cập nhật tỷ lệ hoàn thành %).
    *   [docs/ai-state/NEXT_TASKS.md](file:///opt/projects/steeltrack/docs/ai-state/NEXT_TASKS.md) (Loại bỏ các task đã xong và lên kế hoạch task tiếp theo).
3.  **Tuyệt đối không commit trực tiếp mã giữ chỗ (placeholder)** hoặc các đoạn code ghi chú `TODO` mà chưa được khai báo quyền hoặc không có kế hoạch giải quyết cụ thể.
