# Phase 03 & 04: UI Components & Screens App (Website Replica)
Status: ✅ Complete
Dependencies: Phase 02 (Authentication)

## Objective
Xây dựng lại toàn bộ giao diện Mobile App cho nhân viên gom hàng với tỷ lệ chính xác (pixel-perfect) hoặc UI/UX tương đồng 100% so với bản Website theo kiến trúc React Native. Màn hình sẽ chia theo Role (Manager / Worker).

## Requirements

### Flow & Components (từ Web sang App)
- [x] **Role Selection:** Đã xử lý routing tự động theo Role (`AppNavigator.js`).
- [ ] **Manager (Quản lý):**
    - [ ] Màn hình Dashboard: Thống kê tổng tiền giao ca, tiền đã chi, biểu đồ theo ngày, danh sách nhân viên đã chi (`/manager/dashboard`).
    - [ ] Quản lý ca làm việc (Shift Management).
    - [ ] Quản lý Đơn hàng (Orders).
    - [ ] Quản lý Nhân viên (Staff).
    - [ ] Quản lý Khách hàng (Customers).
    - [ ] Quản lý Quầy (Counters).
- [ ] **Worker (Nhân viên gom hàng):**
    - [ ] Màn hình Home (Trạng thái ca): Hiển thị tiền giao ca hiện tại, số dư quỹ, nút Bắt đầu ca (nếu chưa có) / Báo cáo cuối ca (`/worker/home`).
    - [ ] Màn hình Nhận ca (Start Shift).
    - [ ] Màn hình Tạo hóa đơn gom (Create Order).
    - [ ] Màn hình Chi tiết hóa đơn (Order Detail).
    - [ ] Màn hình Kết ca (End Shift).

### Kỹ thuật sử dụng
- [ ] **UI Framework:** Tự dựng bằng `StyleSheet` của React Native hoặc thư viện bên 3rd party nếu cần (native base, tamagui). Ưu tiên code thuần cho nhẹ trước.
- [ ] **Components dùng chung (Common):**
    - `Button`, `Input`, `Avatar`, `Card`, `Modal`, `BottomSheet`.
    - [x] `BottomNavigation` (cho Admin và cho Worker).
- [ ] **Kết nối Navigation:**
    - Sử dụng `AppNavigator` đã tạo ở Phase 02, phân luồng Stack + Tabbar (Nested Navigation).

## Implementation Steps
### 1. Dựng Common UI Components
- [x] Component Button tuỳ chuẩn (Primary, Outline, Danger).
- [x] Component Input form text (Có label, icon, validate).
- [x] Component Loading Spinner / Overlay.
- [x] Component Card hiển thị order / shift.
- [x] Component Custom Bottom Navigation (cho Worker và Manager).

### 2. Dựng Screens Role: Worker
- [x] `WorkerHomeScreen`: Hiển thị ca hiện tại.
- [x] `CreateOrderScreen`: Form lớn nhập liệu (KH, quầy, các loại tiền phí).
- [x] Tính toán realtime tổng tiền ngay trên form dựa theo `plan.txt`.
- [x] `EndShiftScreen`: Tổng kết quỹ.

### 3. Dựng Screens Role: Manager
- [x] `ManagerDashboardScreen`: Call API đọc thống kê, render giao diện.
- [x] Các màn hình list (Shift, Order, Staff, Khách hàng, Quầy).

## Notes
- Toàn bộ phải tích hợp gọi AuthContext (để lấy User Info / Token).
- Giao diện chú trọng đến trải nghiệm trên Điện thoại (Bàn phím không che form, nút bấm to rõ).

---
Next Phase: Phase 05 - Căng chỉnh & Tích hợp gọi API Server.
