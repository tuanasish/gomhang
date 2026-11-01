━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HANDOVER DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Đang làm: Nợ cũ khách hàng tự động + Thống kê đơn khách Ngày/Tháng/Năm + Khớp số liệu Ca làm & Tổng quan
🔢 Đến bước: Đã sửa đồng bộ số liệu, đã tối ưu cấu hình Android và đang build APK mới trên EAS Cloud

✅ ĐÃ XONG:
   - Backend API: Thêm endpoint `GET /api/customer-fees/previous-bill/:customerId?date=YYYY-MM-DD` để tự động tra cứu hóa đơn & nợ của ngày gần nhất trước đó ✓
   - CustomerDetailScreen: Hiển thị placeholder nợ mờ của ngày hôm trước + nút bấm nhỏ `+ Lấy nợ hôm trước` để tự động điền và cộng vào Tổng cần thanh toán ✓
   - CustomerDetailScreen: Nút Lưu đã lưu cả phí đóng gửi và lưu nợ vào SecureStore ✓
   - AdminCustomersScreen: Thêm bộ lọc Ngày - Tháng - Năm (chuyển ngày nhanh, pick ngày) ✓
   - AdminCustomersScreen: Sắp xếp danh sách khách hàng từ NHIỀU ĐƠN NHẤT ➔ ÍT ĐƠN NHẤT (#1, #2, #3...) ✓
   - AdminCustomersScreen: Cho phép bấm mở rộng xem chi tiết từng đơn hàng (Quầy, NV, Tiền ứng, Thuế, Tổng) giống đơn nhân viên đánh ở Dashboard ✓
   - Sửa triệt để lệch số liệu Ca làm vs Tổng quan: Tự động tính `tongTienHangDaTra` và `quyConLai` từ các đơn hàng thực tế trong `shifts.controller.ts` ✓
   - Đã đồng bộ lại 209 ca cũ trong Database Supabase để 100% ca khớp số chuẩn xác với thực tế ✓
   - Fix lỗi Gradle build: Gỡ các file cache Windows `.gradle` khỏi repository, update `.gitignore`, bổ sung `patch-package` ✓
   - Đã push toàn bộ commit lên GitHub: https://github.com/tuanasish/gomhang.git ✓

⏳ CÒN LẠI:
   1. EAS Android APK build đang chạy:
      Link theo dõi & tải APK: https://expo.dev/accounts/tuanasish/projects/gomhangpro-app/builds/1847718e-dae9-442d-8c58-344e1367ba47
   2. Deploy Backend:
      Code đã được push lên main trên GitHub. Nếu Vercel có GitHub integration thì Vercel sẽ tự deploy, hoặc chạy `npx vercel login` rồi `cd gomhangpro-backend-vercel; npx vercel --prod --yes`
   3. Chờ tài khoản Apple Developer mới được kích hoạt để submit TestFlight cho iOS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Đã lưu trạng thái!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
