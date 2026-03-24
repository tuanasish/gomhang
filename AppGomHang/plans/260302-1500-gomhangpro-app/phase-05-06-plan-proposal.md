# Báo Cáo So Sánh Tính Năng: Web vs App

Dưới đây là danh sách phân tích toàn bộ các màn hình hiện có trên phiên bản Web (frontend/pages) đối chiếu với phiên bản App (gomhangpro-app/src/screens).

## 1. Authentication & Common (Đăng nhập & Dùng chung)

| Màn hình (Web) | Màn hình (Mobile App) | Trạng thái | Ghi chú |
| :--- | :--- | :---: | :--- |
| `Login` | `LoginScreen` | ✅ Hoàn thành | Đã có UI và AuthContext tích hợp sẵn. |
| `RoleSelection` | N/A | ✅ Xử lý ngầm | Web dùng trang riêng chọn role, App dùng logic ngầm trong `RootNavigator` để tự động điều hướng. |
| N/A | `ProfileScreen` | ⚠️ Mock Data | Hiện tại cung cấp thông tin cá nhân và nút Đăng xuất (Dùng chung cho cả 2 role). |

## 2. Role: Worker (Nhân viên)

| Màn hình (Web) | Màn hình (Mobile App) | Trạng thái | Ghi chú |
| :--- | :--- | :---: | :--- |
| `WorkerHome` | `WorkerHomeScreen` | ✅ Hoàn thành | Đã đầy đủ UI: Tiền hiện tại, Danh sách đơn gần đây, Nút tạo đơn. |
| `CreateOrder` | `CreateOrderScreen` | ✅ Hoàn thành | Form tạo đơn siêu to, tính toán realtime tổng tiền. |
| `EndShift` | `EndShiftScreen` | ✅ Hoàn thành | Tổng kết quỹ, số dư cuối ca và nút xác nhận. |
| `StartShift` | ❌ Chưa có | 🔴 Thiếu | Màn hình/Popup dành cho nhân viên bấm bắt đầu ca làm việc. |
| `OrderDetail` | ❌ Chưa có | 🔴 Thiếu | Xem chi tiết 1 đơn hàng cụ thể. |
| `WorkerHistory`| `ShiftScreen` (Dùng chung) | ⚠️ Tạm thay thế | Màn hình danh sách ca làm việc trên app tạm thay thế. Cần làm chuẩn giao diện lịch sử riêng. |
| `WorkerAccount`| `ProfileScreen` (Dùng chung) | ⚠️ Tạm thay thế | Thông tin tài khoản nhân viên. |

## 3. Role: Manager (Quản lý)

| Màn hình (Web) | Màn hình (Mobile App) | Trạng thái | Ghi chú |
| :--- | :--- | :---: | :--- |
| `ManagerDashboard` | `ManagerDashboardScreen` | ✅ Hoàn thành | Thống kê theo ngày, biểu đồ, danh sách đã chi theo nhân viên. |
| `AdminShifts` | `ShiftScreen` (Dùng chung) | ⚠️ UI Đơn giản | Web có tính năng "Tạo ca mới", quản lý giao tiền cho nhân viên. App chỉ mới có List xem danh sách. |
| `ManagerOrders` | `OrderScreen` (Dùng chung) | ⚠️ UI Đơn giản | Quản lý hóa đơn toàn hệ thống. App cần thêm chức năng lọc/tìm kiếm như Web. |
| `AdminStaff` | ❌ Chưa có | 🔴 Thiếu | Quản lý danh sách nhân viên, thêm mới nhân viên. |
| `AdminCustomers` | ❌ Chưa có | 🔴 Thiếu | Quản lý khách hàng, công nợ. |
| `CustomerDetail` | ❌ Chưa có | 🔴 Thiếu | Chi tiết khách hàng (Lịch sử thanh toán). |
| `AdminCounters` | ❌ Chưa có | 🔴 Thiếu | Quản lý quầy thanh toán (Tạo/Sửa). |

---

## 🚀 TỔNG KẾT & ĐỀ XUẤT KẾ HOẠCH (PHASE 05 & 06)

**Tiến độ hiện tại:**
- Sự đồng nhất **UI/UX đã đạt ~60% chức năng cốt lõi** so với Web.
- Các luồng **chính và quan trọng nhất** đã xong: Đăng nhập -> Worker xem ca -> Tạo đơn -> Kết ca -> Quản lý xem Dashboard.

**Các tính năng bị thiếu (Cần thiết lập Phase 05 & 06):**
Để clone 100% bản Web, chúng ta sẽ cần lên plan cho các Phase tiếp theo:

### Đề xuất Phase 05: Tính năng bổ sung cho Worker
- [x] Dựng `StartShiftScreen` (Bắt đầu ca làm).
- [x] Dựng `OrderDetailScreen` (Chi tiết đơn hàng).
- [x] Dựng `WorkerHistoryScreen` (Lịch sử làm việc dạng lịch sử ca hoặc lệnh).

### Đề xuất Phase 06: Các modules Quản lý cho Manager
- [ ] Hoàn thiện `AdminShiftsScreen` (Thêm nút Tạo ca, Giao tiền). Cần thay chung `ShiftScreen` bằng 2 màn độc lập hoặc tách logic tốt hơn.
- [ ] Dựng `AdminStaffScreen`.
- [ ] Dựng cụm `AdminCustomersScreen` & `CustomerDetailScreen`.
- [ ] Dựng `AdminCountersScreen`.
- [ ] Tuỳ chỉnh nâng cao màn `OrderScreen` cho Manager.

### Đề xuất Phase 07: Data Binding (Ghép API)
- [ ] Xóa bỏ toàn bộ Mock Data.
- [ ] Gọi API thật từ Backend, cấu hình Axios interceptors.
