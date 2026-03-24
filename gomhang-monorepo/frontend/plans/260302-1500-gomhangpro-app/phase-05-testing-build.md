# Phase 05: Testing & TestFlight Build
Status: ⬜ Pending

## Objective
Kiểm thử toàn diện App, cấu hình Signing Certificate và đẩy bản Build đầu tiên lên Apple TestFlight.

## Requirements
### Functional
- [ ] Build thành công App IPA cho iOS.
- [ ] Đẩy App lên App Store Connect thành công.

### Non-Functional
- [ ] Cài đặt EAS (Expo Application Services) nếu dùng Expo, hoặc Fastlane nếu dùng RN thuần, để auto build.
- [ ] Đủ App Icon, Splash Screen, App Name chuẩn xác.

## Implementation Steps
1. [ ] Thiết kế và thêm App Icon, Splash Screen cơ bản.
2. [ ] Thiết lập tài khoản Apple Developer (yêu cầu từ Khách hàng / Quản lý).
3. [ ] Cấu hình `eas build` cho iOS profile (nâng cao).
4. [ ] Build & Submit to TestFlight.

## Files to Create/Modify
- `app.json` (versioning, buildNumber).
- Thêm folder `assets/` (images, icons).

## Test Criteria
- [ ] Nhân viên tải được app từ app TestFlight trên iPhone.
- [ ] Trải nghiệm app trên thiết bị thật mượt, call API bình thường.

---
End of Plan.
