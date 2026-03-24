# Phase 02: React Query Setup & API Refactor
Status: ✅ Complete

## Objective
Khởi tạo và cấu hình `QueryClient` để quản lý bộ nhớ đệm (cache) cho toàn bộ ứng dụng, tạo nền tảng cho việc load data "tiệm cận realtime".

## Requirements
### Functional
- [x] Bọc toàn bộ app bên trong `QueryClientProvider` ở `App.js`.
- [x] Cấu hình `QueryClient` với thời gian stale-time phù hợp để không gọi API quá nhiều nhưng vẫn đảm bảo dữ liệu mới (ví dụ: `staleTime: 1000 * 60 * 5` tức 5 phút).
- [ ] Tích hợp React Query Devtools (tùy chọn trong môi trường dev - *Bỏ qua vì trên RN cần plugin phụ*).

## Implementation Steps
1. [x] Khởi tạo `queryClient` với cấu hình mặc định trong `src/api/queryClient.js`.
2. [x] Bọc `RootNavigator` bằng `QueryClientProvider` trong `App.js`.
3. [x] Tạo các Custom Hooks cho việc fetching (vd: `useOrders`, `useShifts`) trong thư mục `src/hooks/queries/`.

## Files to Modify
- `App.js` - Wrap app với Provider
- `src/hooks/queries/` (Thư mục mới) - Nơi chứa các custom hooks cho React Query.

## Notes
Nếu app đã cài sẵn \`@tanstack/react-query\` thì chỉ cần áp dụng, nếu chưa thì sẽ cài đặt thêm.

---
Next Phase: Phase 03 Tab Screens Transition
