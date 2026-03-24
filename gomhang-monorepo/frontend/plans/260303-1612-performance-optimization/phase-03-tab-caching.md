# Phase 03: Tab Screens Transition (Near Realtime)
Status: ✅ Completed

## Objective
Thay thế việc gọi API trực tiếp và ép load lại màn hình bằng React Query ở các màn hình có Tab chính. Khi chuyển Tab, UI sẽ hiển thị dữ liệu cache ngay lập tức (tiệm cận realtime), và rà soát background fetch để cập nhật mới.

## Requirements
### Functional
- [x] Refactor `ManagerDashboardScreen`: Thay thế `useEffect` / `useFocusEffect` gọi `getOrdersByDateAPI` và `getShiftsListAPI` bằng `useQuery`.
- [x] Refactor `ManagerOrdersScreen`: Tương tự, sử dụng `useQuery` và truyền `staleTime` để giữ list mượt.
- [x] Tích hợp Pull-to-Refresh: Kết nối Component `RefreshControl` với hàm `refetch()` của React Query thay vì tự viết logic loading state cục bộ.

## Implementation Steps
1. [x] Cập nhật `ManagerDashboardScreen`. Lịch sử chuyển tab sẽ không còn giật lag.
2. [x] Cập nhật `ManagerOrdersScreen`.
3. [x] (Tùy chọn) Cập nhật `AdminShiftsScreen` và `AdminCustomersScreen` theo cùng pattern Nếu cần.

## Files to Modify
- `src/screens/manager/ManagerDashboardScreen.js`
- `src/screens/manager/ManagerOrdersScreen.js`
- (Các file màn hình quản lý khác có danh sách dữ liệu nặng)

## Notes
Loại bỏ hoàn toàn các `ActivityIndicator` ở mức toàn bộ màn hình khi chuyển Tab. Dùng giao diện skeleton (hoặc hiển thị cache) thay thế.

---
Next Phase: Phase 04 Testing & Final Polish
