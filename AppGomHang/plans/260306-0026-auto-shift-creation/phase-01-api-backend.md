# Phase 01: API & Logic Backend
Status: ⬜ Pending
Dependencies: Bắt đầu dự án

## Objective
Cho phép nhân viên tự kích hoạt một ca làm việc mới mà không cần cấp quyền rườm rà, mặc định số vốn ban đầu bằng 0. Đảm bảo logic tạo đơn hàng cho phép tổng doanh thu tiền mặt bị âm.

## Requirements
### Functional
- [ ] API `POST /api/shifts/start-auto`: Thêm logic cho phép một nhân viên tự tạo ca mới nếu hiện tại không có ca nào mở. `tongTienMatBanDau = 0`.
- [ ] API `POST /api/orders`: Đảm bảo không có validate nào chặn việc doanh thu của ca bị âm khi tạo đơn hàng có `tienHang` và phải thối lại.
- [ ] Bảng `shifts`: Đảm bảo các field tiền tệ cho phép số âm.

## Files to Create/Modify
- `backend/src/controllers/shifts.controller.ts` - Thêm Cập nhật controller mở ca
- `backend/src/routes/shifts.routes.ts` - Thêm route cho việc tự mở ca
- `backend/src/controllers/orders.controller.ts` - Review lại logic tạo đơn xem có chặn quỹ âm không

## Test Criteria
- [ ] Mở ca thành công với vốn = 0 mà không cần Admin.
- [ ] Tạo một phiếu chi hoặc hóa đơn trả lại khiến quỹ âm mà không báo lỗi "Không đủ tiền".

---
Next Phase: Phase 02
