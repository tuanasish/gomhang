# Phase 02: Authentication & Core Sync
Status: ⬜ Pending

## Objective
Thực hiện chức năng Đăng nhập cho nhân viên và tích hợp cơ chế bảo mật (Token/Cookie) như trên website.

## Requirements
### Functional
- [ ] Màn hình Đăng nhập (Input: Username/Email & Password).
- [ ] Tích hợp API Login xuống Backend hiện tại.
- [ ] Lưu Storage an toàn (SecureStore) cho Access Token/Cookie.
- [ ] Cơ chế Tự động làm mới Token (nếu web đang dùng).

### Non-Functional
- [ ] Secure lưu credentials.
- [ ] Xử lý Loading state, Error Message trực quan.

## Implementation Steps
1. [ ] Cấu hình Store/Context API để quản lý Auth State.
2. [ ] Viết API Service cho login/logout.
3. [ ] Code UI Màn hình Login.
4. [ ] Liên kết UI với API và lưu trữ state.

## Files to Create/Modify
- `src/screens/LoginScreen.tsx`
- `src/context/AuthContext.tsx`
- `src/api/auth.js`

## Test Criteria
- [ ] Đăng nhập thành công với tài khoản nhân viên thật trên web.
- [ ] Tắt app bật lại vẫn giữ trạng thái đăng nhập.

---
Next Phase: phase-03-ui.md
