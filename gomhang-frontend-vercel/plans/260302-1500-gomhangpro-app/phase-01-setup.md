# Phase 01: Project Setup
Status: ✅ Complete

## Objective
Khởi tạo dự án React Native (Expo) và kết nối môi trường phát triển cho gomhangpro-app.

## Requirements
### Functional
- [x] Chạy được app rỗng trên iOS Simulator & Android Emulator.
- [x] Tích hợp được cấu hình môi trường (.env) để chỉ định URL Backend của website hiện tại.

### Non-Functional
- [x] Config Eslint + Prettier chuẩn mực.
- [x] Quản lý package bằng Yarn hoặc pnpm (đồng bộ với web).

## Implementation Steps
1. [x] Khởi tạo dự án: `npx create-expo-app gomhangpro-app`
2. [x] Thiết lập thư mục: `src/screens`, `src/components`, `src/api`, `src/navigation`.
3. [x] Khởi tạo Git & Initial Commit
4. [x] Cấu hình biến môi trường kết nối API.

## Files to Create/Modify
- `app.json` (cấu hình tên, bundle ID cho iOS/Android).
- `src/api/client.js` (cấu hình axios/fetch chung).

## Test Criteria
- [x] App lên màn hình Hello Gomhangpro.
- [x] Gọi thử API ping tới Backend website thành công.

---
Next Phase: phase-02-auth.md
