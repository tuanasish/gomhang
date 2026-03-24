# Migration Guide: Cho phép xóa nhân viên mà vẫn giữ hóa đơn

## Mục đích
Cho phép xóa nhân viên ngay cả khi nhân viên đó có đơn hàng. Khi xóa nhân viên, các hóa đơn sẽ được giữ lại nhưng `staff_id` sẽ được set thành `NULL`.

## Migration Script
Chạy file migration: `backend/database/migration_allow_delete_staff_keep_orders.sql`

## Các thay đổi

### Database
1. Thay đổi `orders.staff_id` từ `NOT NULL` sang `NULLABLE`
2. Thay đổi foreign key constraint từ `ON DELETE RESTRICT` sang `ON DELETE SET NULL`

### Backend Code
1. Cập nhật `Order` interface: `staffId` từ `string` sang `string | undefined`
2. Cập nhật `deleteStaff` controller: bỏ kiểm tra "có đơn hàng"
3. Cập nhật tất cả responses trong `orders.controller.ts`: convert `null` thành `undefined` cho `staffId`

### Frontend Code
1. Cập nhật `Order` interface trong `orders.service.ts`: `staffId` từ `string` sang `string | undefined`

## Hành vi sau migration
- ✅ Có thể xóa nhân viên ngay cả khi có đơn hàng
- ✅ Hóa đơn vẫn được giữ nguyên
- ✅ `staff_id` trong các hóa đơn liên quan sẽ tự động set thành `NULL` khi xóa nhân viên
- ✅ Các ca làm việc (shifts) vẫn bị xóa do CASCADE (vì shifts phụ thuộc vào staff)

## Lưu ý
- Khi hiển thị đơn hàng, nếu `staffId` là `undefined`, có thể hiển thị "Đã xóa" hoặc "N/A" cho tên nhân viên
- Các báo cáo/thống kê có thể cần xử lý đặc biệt cho các đơn hàng không có `staff_id`

