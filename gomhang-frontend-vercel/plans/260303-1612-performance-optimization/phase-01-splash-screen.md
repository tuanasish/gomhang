# Phase 01: Splash Screen Optimization
Status: ✅ Complete

## Objective
Giảm thời gian chờ trắng màn hình lúc mở app bằng cách giữ Splash Screen của hệ điều hành cho đến khi app sẵn sàng (đọc xong token từ SecureStore).

## Requirements
### Functional
- [x] Cài đặt `expo-splash-screen` (nếu chưa có).
- [x] Giữ Splash Screen hiển thị ( `SplashScreen.preventAutoHideAsync()` ) khi app khởi động.
- [x] Chỉ ẩn Splash Screen (`SplashScreen.hideAsync()`) sau khi `AuthContext` hoàn tất việc kiểm tra trạng thái login.

## Implementation Steps
1. [x] Kiểm tra và cài `expo-splash-screen`.
2. [x] Sửa `App.js`: Khởi tạo Navigation Container ngay lập tức thay vì render màn hình Loading trắng. 
3. [x] Sửa `AuthContext.js` / `RootNavigator.js`: Xóa bỏ việc render thẻ `<ActivityIndicator>` block UI lúc đầu. Điều khiển Splash Screen thay thế.

## Files to Modify
- `App.js` - Sửa logic khởi động
- `src/navigation/RootNavigator.js` - Bỏ màn hình loading cũ
- `src/context/AuthContext.js` - Điều phối việc load token
- `app.json` - Kiểm tra cấu hình splash

## Notes
Đảm bảo Splash Screen nhìn mượt mà, đồng nhất với màu nền hệ thống.

---
Next Phase: Phase 02 React Query Setup
