━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 HANDOVER DOCUMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Đang làm: Chuyển app sang tài khoản Apple Developer mới (TestFlight)
🔢 Đến bước: Đang chờ Apple kích hoạt tài khoản mới (thông báo ~2 ngày)

✅ ĐÃ XONG:
   - Đăng ký Apple Developer Program diện Individual / Sole Proprietor ✓
   - Cập nhật Bundle Identifier thành: com.gomhangpro.tuanasish ✓
   - Reset buildNumber: 1 cho iOS trong app.json ✓
   - Cập nhật eas.json (xoá ascAppId cũ, đổi bundleIdentifier mới) ✓
   - Xoá debug console.log trong CreateOrderScreen.js ✓
   - session.json đã cập nhật ✓

⏳ CÒN LẠI (Thực hiện ngay khi tài khoản Apple được kích hoạt):
   1. Vào App Store Connect -> Users and Access -> Integrations -> App Store Connect API:
      - Tạo Key mới (Role Admin)
      - Tải file .p8 lưu vào thư mục dự án
      - Lấy Key ID và Issuer ID điền vào eas.json
   2. Chạy `npx eas credentials` để xoá credentials cũ của Apple Team cũ và cấp mới cho Team mới.
   3. Chạy `npx eas build --platform ios --profile production --auto-submit` để đẩy lên TestFlight.
   4. Bật External Testing (Public Link) trên TestFlight để chia sẻ link cho nhân viên.

🔧 QUYẾT ĐỊNH QUAN TRỌNG:
   - Bundle Identifier mới: com.gomhangpro.tuanasish
   - Loại tài khoản Apple: Individual (Cá nhân)

📁 FILES QUAN TRỌNG:
   - app.json (đã đổi bundleIdentifier & buildNumber=1)
   - eas.json (cấu hình submit)
   - .brain/session.json & .brain/handover.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Đã lưu trạng thái! Khi tài khoản Apple được kích hoạt, bạn chỉ cần gõ: tiếp tục
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
