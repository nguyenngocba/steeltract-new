# Kế Hoạch Thiết Kế Lại Modal Chi Tiết (Popup Redesign V3)

**Dự án**: SteelTrack ERP - Executive Dashboard Redesign V3

---

## 1. Thiết Kế Mới Của Modal Phân Tích Chi Tiết
- **Hiệu ứng Kính Cường Lực (Glassmorphism)**: Kích thước `95vw` x `92vh`, nền tối mờ `bg-slate-950/90 backdrop-blur-lg` với viền sáng mờ cyan/white.
- **Thanh Bên Trái (Filters & Summary)**: 
  - Đầy đủ các bộ lọc đa chiều (Kho hàng, Công trình, Nhóm vật tư, Nhà cung cấp).
  - Khối tóm tắt Giá trị hiện tại lớn đậm nổi bật.
- **Vùng Nội Dung Phải (70% Biểu đồ, 30% Bảng biểu)**:
  - **Hàng 5 thẻ KPI**: Hiện tại, Trung bình, Cao nhất, Thấp nhất, Tăng trưởng.
  - **Biểu đồ lớn Xu hướng 12 tháng**: Line/Area chart chiếm 40% chiều cao của màn hình phân tích.
  - **Hàng Biểu đồ Phân tích & Phân bổ**:
    - *Bên trái*: Top 10 Ranking ngang (Horizontal Bar).
    - *Bên phải*: Biểu đồ phân bổ hình tròn (Donut).
  - **Bảng Số Liệu Chi Tiết**: Rút gọn, sticky header, giới hạn tối đa 5-8 dòng hiển thị cuộn bên trong.
  - **Highlights**: Các thông tin chỉ báo nhanh dưới chân modal.

---

## 2. Ràng Buộc Dữ Liệu Thực Tế (Real Data Constraints)
- Toàn bộ dữ liệu trong biểu đồ chi tiết được truyền trực tiếp từ các Query hook của hệ thống.
- Khi không có cache dữ liệu lịch sử hoặc API tương ứng bị lỗi, modal hiển thị thông báo Việt hóa rõ ràng: **"Dữ liệu lịch sử chưa khả dụng"**.
