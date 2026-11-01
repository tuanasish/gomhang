━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HANDOVER DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Đang làm: Nợ cũ khách hàng tự động + Thống kê đơn khách Ngày/Tháng/Năm
🔢 Đến bước: Đã fix lỗi Gradle variant và đang build APK mới trên EAS Cloud

✅ ĐÃ XONG:
   - Backend API: Thêm endpoint `GET /api/customer-fees/previous-bill/:customerId?date=YYYY-MM-DD` để tự động tra cứu hóa đơn & nợ của ngày gần nhất trước đó ✓
   - CustomerDetailScreen: Hiển thị placeholder nợ mờ của ngày hôm trước + nút bấm nhỏ `+ Lấy nợ hôm trước` để tự động điền và cộng vào Tổng cần thanh toán ✓
   - CustomerDetailScreen: Nút Lưu đã lưu cả phí đóng gửi và lưu nợ vào SecureStore ✓
   - AdminCustomersScreen: Thêm bộ lọc Ngày - Tháng - Năm (chuyển ngày nhanh, pick ngày) ✓
   - AdminCustomersScreen: Sắp xếp danh sách khách hàng từ NHIỀU ĐƠN NHẤT ➔ ÍT ĐƠN NHẤT (#1, #2, #3...) ✓
   - AdminCustomersScreen: Cho phép bấm mở rộng xem chi tiết từng đơn hàng (Quầy, NV, Tiền ứng, Thuế, Tổng) giống đơn nhân viên đánh ở Dashboard ✓
   - Fix lỗi Gradle build: Đổi `rootProject.name` trong `settings.gradle` từ `'Gom Hàng Ninh Hiệp'` về `'gomhangpro-app'` (tên app hiển thị trên máy vẫn là 'Gom Hàng Ninh Hiệp' theo strings.xml) ✓
   - Đã push toàn bộ commit lên GitHub: https://github.com/tuanasish/gomhang.git ✓

⏳ CÒN LẠI:
   1. EAS Android APK build đang chạy:
      Link theo dõi & tải APK: https://expo.dev/accounts/tuanasish/projects/gomhangpro-app/builds/ec4b4f5c-4ae7-4d87-86c6-58394365b136
   2. Deploy Backend:
      Vercel CLI trên máy cần đăng nhập lại: gõ `npx vercel login`, sau đó chạy:
      `cd gomhangpro-backend-vercel; npx vercel --prod --yes`
   3. Chờ tài khoản Apple Developer mới được kích hoạt để submit TestFlight cho iOS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Đã lưu trạng thái!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
