━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HANDOVER DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Đang làm: Nợ cũ khách hàng tự động + Thống kê đơn khách Ngày/Tháng/Năm + Khớp số liệu Ca làm & Tổng quan
🔢 Đến bước: ĐÃ BUILD THÀNH CÔNG BẢN APK MỚI NHẤT!

✅ ĐÃ HOÀN TẤT & VERIFIED:
   1. Backend API:
      - Thêm endpoint `GET /api/customer-fees/previous-bill/:customerId?date=YYYY-MM-DD` để tra cứu hóa đơn & nợ cũ ngày trước đó.
      - Sửa dứt điểm lệch số liệu giữa Ca làm và Tổng quan: Tự động tính `tongTienHangDaTra` và `quyConLai` trực tiếp từ các đơn hàng thực tế của ca trong `shifts.controller.ts`.
      - Đã đồng bộ 209 ca cũ trong Supabase, số liệu 100% khớp chuẩn xác.
      - Đã push nhánh `main` lên GitHub: https://github.com/tuanasish/gomhang.git.
   2. App Mobile:
      - CustomerDetailScreen: Hiển thị placeholder nợ mờ của ngày hôm trước + nút bấm nhỏ `+ Lấy nợ hôm trước` để tự động điền và cộng vào Tổng cần thanh toán. Nút "Lưu" lưu cả phí đóng gửi và nợ cũ vào SecureStore.
      - AdminCustomersScreen: Thêm bộ lọc Ngày - Tháng - Năm (chuyển ngày nhanh, pick ngày) và sắp xếp danh sách khách hàng từ NHIỀU ĐƠN NHẤT ➔ ÍT ĐƠN NHẤT (#1, #2, #3...). Cho phép mở rộng xem chi tiết từng đơn hàng.
      - Fix lỗi Android Build: Xóa cache gradle Windows, thêm patch-package, cấu hình rootProject.name chuẩn.
   3. EAS Build APK:
      - Build thành công bản APK mới!
      - Link tải trực tiếp: https://expo.dev/artifacts/eas/LliU3hIDGYgUWXbqe1gIaUi_6LP7dWQyB_DTuuBJjGY.apk
      - Link trang quản lý build: https://expo.dev/accounts/tuanasish/projects/gomhangpro-app/builds/1847718e-dae9-442d-8c58-344e1367ba47

⏳ TIẾP THEO:
   1. Cài đặt file APK trên điện thoại để trải nghiệm các tính năng mới.
   2. Khi tài khoản Apple Developer mới được Apple duyệt xong, chỉ cần chạy build iOS TestFlight.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Đã lưu trạng thái!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
