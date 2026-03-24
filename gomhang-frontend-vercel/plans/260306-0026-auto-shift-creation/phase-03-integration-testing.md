# Phase 03: Integration & Testing
Status: ⬜ Pending
Dependencies: Phase 02

## Objective
Kết nối API mới với giao diện, đảm bảo toàn bộ luồng tạo ca, tạo đơn (bị âm tiền), và kết ca hoạt động trơn tru.

## Requirements
### Integration
- [ ] Tích hợp API `start-auto-shift` vào nút "Bắt đầu làm việc" trên Frontend.
- [ ] Gắn query invalidate để tự động refresh danh sách ca sau khi tạo thành công.

### Testing
- [ ] Giả lập tài khoản nhân viên chưa có ca nào mở. Bấm "Bắt đầu làm việc", kiểm tra Backend có tạo ca với vốn = 0 không.
- [ ] Thử tạo một hóa đơn thối tiền thừa khiến quỹ tiền mặt bị âm (Ví dụ: khách mua 10k, đưa 500k, thối 490k -> Quỹ -490k). Xem có báo lỗi gì không.
- [ ] Xem dashboard của quản lý hiển thị các ca bị âm tiền như thế nào.

---
Next Phase: N/A
