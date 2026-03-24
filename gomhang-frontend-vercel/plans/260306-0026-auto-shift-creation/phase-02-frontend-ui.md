# Phase 02: Frontend UI & Store
Status: ⬜ Pending
Dependencies: Phase 01

## Objective
Chỉnh sửa giao diện màn hình Ca Làm Việc để nhân viên thao tác mượt mà trong 1 nút bấm (One-tap). Xử lý việc hiển thị "Âm tiền" không bị lỗi UI.

## Requirements
### Functional
- [ ] **ShiftScreen.js (Dành cho nhân viên):** Nút "Nhận ca" sửa thành "Bắt đầu làm việc (Tạo ca)". Click vào sẽ tự lấy giờ hiện tại và vốn = 0 để gọi API tự tạo ca.
- [ ] **CreateOrderScreen.js:** Đảm bảo khi tạo đơn thối tiền thừa, phần hiển thị số dư quỹ có định dạng màu đỏ/hiển thị rõ dấu trừ (-) nếu quỹ âm.
- [ ] Giấu đi các giao diện nhập liệu "Số vốn ban đầu" dư thừa đối với UI của nhân viên.

## Files to Create/Modify
- `src/screens/common/ShiftScreen.js` - Đơn giản hóa UI Nhận ca
- `src/components/CreateOrder/PaymentSummary.js` (hoặc view tương ứng) - Xử lý hiển thị quỹ âm
- `src/hooks/queries/useShifts.js` - Thêm func gọi API `start-auto-shift`

## Test Criteria
- [ ] Ấn nút "Bắt đầu làm việc" là vào thẳng màn hình bán hàng, không cần nhập vốn.
- [ ] Hiện số dư quầy ÂM bằng màu đỏ.

---
Next Phase: Phase 03
