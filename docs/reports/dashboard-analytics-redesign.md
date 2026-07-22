# Báo cáo Tái cấu trúc Biểu đồ Phân tích (Dashboard Analytics Redesign)

Date: 2026-07-22
Auditor: Antigravity AI
Status: **COMPLETED & CERTIFIED**

---

## 1. Danh sách Biểu đồ & Câu hỏi Điều hành (Management Questions)

Toàn bộ biểu đồ đơn giản đã được thay thế bằng các phân tích vận hành thực tế tại trang **Analytics (`AnalyticsPage.tsx`)**, trả lời trực tiếp các câu hỏi của ban giám đốc:

### A. Phân hệ Tồn kho (Inventory)
1. **Mức độ lấp đầy kho (Stacked Bar)**:
   - *Câu hỏi:* Kho hàng nào đang dần đầy công suất chứa?
   - *Nguồn:* `useWarehouses` & `useInventoryAudit`
2. **Top 10 Vật tư thiếu hụt (Horizontal Bar)**:
   - *Câu hỏi:* Vật tư nào cần đặt mua gấp ngay lúc này?
   - *Nguồn:* `getInventoryItems` (lọc `quantity <= minQuantity`)
3. **Cơ cấu Vật tư theo Nhóm (Donut/Progress)**:
   - *Câu hỏi:* Tồn kho đang tập trung ở nhóm vật tư nào?
   - *Nguồn:* `getInventoryItems`
4. **Biến động xuất nhập kho (Line Chart / Timeline)**:
   - *Câu hỏi:* Lượng giao dịch kho đang tăng hay giảm?
   - *Nguồn:* `useInventoryTransactions` (Sử dụng dữ liệu lịch sử thực tế)

### B. Phân hệ Sản xuất (Production)
1. **Cơ cấu Trạng thái MO (Donut)**:
   - *Câu hỏi:* Tỷ lệ lệnh sản xuất đang chạy so với nghẽn là bao nhiêu?
   - *Nguồn:* `productionApi.orders`
2. **Tiến độ Lệnh gia công (Progress Bar)**:
   - *Câu hỏi:* Hiệu suất hoàn thành lệnh thực tế đạt bao nhiêu phần trăm?
   - *Nguồn:* `productionApi.orders`

### C. Phân hệ Giao vận (Logistics)
1. **Trạng thái Chuyến vận chuyển (Donut)**:
   - *Câu hỏi:* Có bao nhiêu xe đang thực sự lăn bánh trên đường?
   - *Nguồn:* `getDispatchOrders`
2. **Hiệu suất sử dụng đầu xe (Horizontal Bar)**:
   - *Câu hỏi:* Đầu xe hoặc tài xế nào hoạt động nhiều nhất?
   - *Nguồn:* `getDispatchOrders`

### D. Phân hệ Chất lượng (QC)
1. **Tỷ lệ đạt kiểm định QC (Donut)**:
   - *Câu hỏi:* Lượng hàng đạt chuẩn chất lượng xuất xưởng là bao nhiêu?
   - *Nguồn:* `getQcCockpit`
2. **Phân loại Sự cố Không phù hợp (Defect Bar)**:
   - *Câu hỏi:* Trọng tâm lỗi QC thường nằm ở công đoạn nào?
   - *Nguồn:* `getQcCockpit.byCategory`

### E. Phân hệ Dự án (Projects)
1. **Tiến độ WBS Công trình (Vertical Bar)**:
   - *Câu hỏi:* Dự án nào sắp cán mốc bàn giao 100%?
   - *Nguồn:* `getProjectsRuntime`
2. **Giá trị Công trình (Revenue Bar)**:
   - *Câu hỏi:* Dự án nào đóng góp doanh thu lớn nhất cho công ty?
   - *Nguồn:* `getProjectsRuntime`

---

## 2. Điểm Sức khỏe Điều hành (Executive Health Score)
Tích hợp thuật toán quy đổi tự động từ dữ liệu thực tế:
- **Inventory Health Score**: Lấy tỉ lệ mã hàng an toàn (không bị low stock).
- **Production Health Score**: Tỉ lệ lệnh sản xuất không có phế phẩm.
- **QC Health Score**: Tỉ lệ pass rate thực tế.
- **Logistics Health Score**: Tỉ lệ chuyến xe chạy tuyến thành công.
- **Tổng hợp (Health Score)**: Trung bình cộng 4 phân hệ, trả về trạng thái **Healthy**, **Attention**, hoặc **Critical** hiển thị trực quan.
