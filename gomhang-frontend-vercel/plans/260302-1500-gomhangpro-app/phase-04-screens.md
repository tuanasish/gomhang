# Phase 04: Screens & Navigation
Status: ⬜ Pending

## Objective
Tạo các Màn hình (Screens) chính và kết nối chúng bằng React Navigation/Expo Router.

## Requirements
### Functional
- [ ] Màn hình Home (Dashboard/Tổng quan).
- [ ] Màn hình Danh sách Đơn Hàng (Orders).
- [ ] Màn hình Chi tiết Đơn hàng.
- [ ] Bottom Tab hoặc Drawer Navigation (giống sidebar web).
- [ ] Tích hợp API gọi dữ liệu thật.

### Non-Functional
- [ ] Hiệu ứng chuyển cảnh mượt.
- [ ] Trạng thái Empty / Loading / Error chuẩn.

## Implementation Steps
1. [ ] Cài đặt React Navigation (hoặc Expo Router).
2. [ ] Dựng DashboardScreen và gọi API lấy Dashboard.
3. [ ] Dựng OrderListScreen, OrderDetailScreen.
4. [ ] Thiết lập luồng Auth Stack (nếu chưa login) và Main Stack (khi đã login).

## Files to Create/Modify
- `src/navigation/*`
- `src/screens/DashboardScreen.tsx`
- `src/screens/OrderListScreen.tsx`

## Test Criteria
- [ ] Di chuyển qua lại mượt mà, không lag/crash.

---
Next Phase: phase-05-testing-build.md
