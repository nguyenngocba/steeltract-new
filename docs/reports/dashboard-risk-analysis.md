# Báo cáo Đánh giá Rủi ro Doanh nghiệp (Enterprise Risk Analysis)

Date: 2026-07-22
Auditor: Antigravity AI
Status: **COMPLETED & CERTIFIED**

---

## 1. Ma trận Rủi ro Doanh nghiệp (Enterprise Risk Matrix)

Bảng ma trận phân loại rủi ro tại **Executive Dashboard** quy quét tự động 4 nhóm chính dựa trên quy tắc nghiệp vụ sẵn có của SteelTrack:

### A. Rủi ro Tồn kho (Inventory Risk)
- **Quy tắc kích hoạt**: Đếm số mã vật tư dưới mức dự trữ tối thiểu (`quantity <= minQuantity`).
- **Phân loại**:
  - `Healthy`: 0 mã hàng sắp hết.
  - `Warning`: 1 - 3 mã hàng sắp hết.
  - `Critical`: > 3 mã hàng sắp hết (Cần kích hoạt PO khẩn cấp).

### B. Rủi ro Sản xuất (Production Risk)
- **Quy tắc kích hoạt**: Kiểm tra số lệnh gia công MO phát sinh phế phẩm (`scrapQty > 0` trong dòng consumption).
- **Phân loại**:
  - `Healthy`: 0 lệnh phát sinh phế phẩm.
  - `Critical`: Có lệnh phát sinh phế phẩm (Cần hiệu chuẩn thông số gia công xưởng).

### C. Rủi ro Chất lượng (Quality Risk)
- **Quy tắc kích hoạt**: Đếm số phiếu NCR mở chưa được đóng trên bảng QC (`openNcrs`).
- **Phân loại**:
  - `Healthy`: 0 phiếu NCR mở.
  - `Warning`: 1-2 phiếu NCR mở.
  - `Critical`: > 2 phiếu NCR mở (Nguy cơ chặn dây chuyền giao hàng).

### D. Rủi ro Giao vận (Logistics Risk)
- **Quy tắc kích hoạt**: Đếm số chuyến xe bị hủy tuyến trong ngày (`CANCELLED`).
- **Phân loại**:
  - `Healthy`: 0 chuyến bị hủy.
  - `Warning`: Có chuyến bị hủy (Cần tái lập lịch điều phối).

---

## 2. Điểm Số Sức Khỏe Tổng Hợp (Executive Health Score)
Quy đổi trực quan trung bình cộng sức khỏe của 4 phân hệ cốt lõi để đưa ra đánh giá chỉ huy chung (**Healthy**, **Attention**, hoặc **Critical**).
