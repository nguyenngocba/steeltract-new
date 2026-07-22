# Kế Hoạch Thiết Kế Lại Trang Tổng Quan (Dashboard Redesign V3)

**Dự án**: SteelTrack ERP - Executive Dashboard Redesign V3

---

## 1. Thiết Kế Mới Của Trang Tổng Quan
- **Thanh Chỉ Huy Đầu Trang**: Trực quan hóa tìm kiếm toàn cục, bộ lọc thời gian Executive và lựa chọn phân hệ nhanh.
- **Hàng KPI Cards V3**: Tối giản hóa 100%, làm nổi bật các con số chỉ số điều hành chính:
  1. *Giá trị tồn kho* (VND)
  2. *Số lượng tồn* (Mã vật tư)
  3. *Giá trị nhập* (VND)
  4. *Giá trị xuất* (VND)
  5. *Lệnh sản xuất* (Đang chạy)
  6. *Dự án hoạt động* (Số lượng)
  7. *Giao hàng hôm nay* (Số chuyến xe)
  8. *QC / NCR* (Số lượng NCR mở hoặc Tỷ lệ đạt)
- **Khu Vực Phân Tích Trực Quan**:
  - Loại bỏ hoàn toàn: *Executive Insights*, *Operational Dependency*, *Risk Matrix*, *Cross Module Analytics* dưới dạng văn bản.
  - Thay thế bằng:
    - *Chuỗi trạng thái chuỗi cung ứng*: Progress bars trạng thái lấp đầy từng phân hệ.
    - *Ma trận trạng thái dạng Heatmap màu sắc*: Xanh lục (Healthy), Cam (Warning), Đỏ (Critical), Xanh lam (Normal).
    - *Biểu đồ tròn phân bổ kho hàng*: Donut chart thể hiện tỷ lệ lấp đầy.
    - *Biểu đồ xu hướng lệnh sản xuất*: Đồ thị đường Line trực quan.

---

## 2. Danh Sách Các Thành Phần Loại Bỏ & Thay Thế
- **Loại bỏ**: Tất cả các đoạn mô tả dài dòng về rủi ro hoặc phụ thuộc nghiệp vụ.
- **Thay thế**: Chuyển đổi sang biểu đồ phân bổ hình tròn, cột biểu đồ nhóm và dòng chỉ báo.
