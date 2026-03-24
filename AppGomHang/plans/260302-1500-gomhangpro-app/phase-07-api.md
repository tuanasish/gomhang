# Phase 07: Data Binding & API Integration
Status: 🟡 In Progress
Dependencies: Phase 06 (Hoàn thành UI)

## Lời nói đầu (Overview)
Chào anh! Vậy là giao diện (UI) của cả phần Nhân viên (Worker) và Quản lý (Manager) đã hoàn tất và chạy mượt mà trên App với "dữ liệu giả" (Mock Data).
Phase 7 này là một bước CỰC KỲ QUAN TRỌNG: **"Lắp ghép Não vào Thể xác"**.
Nói cách khác, chúng ta sẽ kết nối App với Backend thật để dữ liệu hiển thị trên điện thoại hoàn toàn khớp với dữ liệu trên website.

## Objective (Mục tiêu)
1. Xây dựng tầng Giao tiếp API chuẩn xác (dùng thư viện kết nối đến Backend).
2. Thiết lập cơ chế lưu trữ Phiên Đăng Nhập (Token/Cookies) an toàn trên điện thoại.
3. Thay thế toàn bộ Dữ liệu Giả (Mock data) bằng dữ liệu thật từ Server.
4. Xử lý các tình huống lỗi mạng, mất kết nối, server bảo trì...

## Implementation Steps (Các bước thực hiện)

### Bước 1: Khởi tạo Tầng Giao Tiếp Mạng (API Layer)
- [ ] Phân tích các file gọi API của phiên bản Web (nằm trong thư mục frontend).
- [ ] Tạo file cấu hình HTTP Client (ví dụ `src/api/axiosClient.js`) dành riêng cho App.
- [ ] Cấu hình Base URL tự động chuyển đổi giữa môi trường Test và Production.

### Bước 2: Nâng cấp luồng Đăng nhập & Xác thực (Authentication)
- [ ] Gọi API Login thật. Lấy Token khi user đăng nhập đúng tài khoản/mật khẩu.
- [ ] Ứng dụng `Expo SecureStore` hoặc `AsyncStorage` để lưu trữ Token bảo mật.
- [ ] Xây dựng tính năng "Tự động Đăng nhập" (Auto-login) nếu user chưa đăng xuất.

### Bước 3: Tích hợp API cho phân hệ Nhân Viên (Worker)
- [ ] **Giao Ca / Nhận Ca:** Load thông tin ca làm việc thật. Mở ca / Đóng ca đẩy dữ liệu về server.
- [ ] **Tạo Đơn Hàng Mới:**
  - Load danh sách Khách hàng từ Database để gợi ý khi tìm số điện thoại.
  - Submit dữ liệu đơn hàng (Tiền hàng, Công gom, Phí đóng hàng...) về Server và nhận xác nhận.
- [ ] **Lịch Sử Đơn Hàng:** Fetch danh sách đơn hàng thực tế của user đó trong ngày.

### Bước 4: Tích hợp API cho phân hệ Quản Lý (Manager)
- [ ] **Danh sách Khách Hàng:** Tải dữ liệu thật và tìm kiếm theo thời gian thực (real-time search).
- [ ] **Danh sách Đơn Hàng Toàn Hệ Thống:** Manager có thể đổi trạng thái đơn (Duyệt/Huỷ) gọi thẳng lên Server.
- [ ] **Quản Lý Ca / Nhân Sự / Quầy:** Tải danh sách, Cập nhật thông tin và Đồng bộ lại cơ sở dữ liệu.

### Bước 5: Cải thiện Trải nghiệm (Error Handling)
- [ ] Thêm Spinner / Loading icon khi đang chờ dữ liệu.
- [ ] Hiện thông báo lỗi dễ hiểu nếu mạng yếu hoặc nhập sai thông tin.
- [ ] Tính năng kéo xuống để làm mới (Pull-to-refresh) trên các danh sách.

## Đề xuất cho anh (Anh chọn giúp em nhé)
👉 Khi xử lý phần đăng nhập, anh muốn:
1. **Lưu phiên đăng nhập vĩnh viễn** (Không tự động bắt người dùng đăng nhập lại sau 1 khoảng thời gian).
2. **Có thời hạn (Ví dụ 30 ngày)** (Sau 30 ngày tự văng ra yêu cầu login lại để an toàn).

Anh xem qua Kế hoạch Phase 7 này, nếu OK thì phản hồi em `Tiến hành luôn` hoặc `/code phase-07` nhé!
