# 💡 BRIEF: gomhangpro-app

**Ngày tạo:** 2026-03-02
**Brainstorm cùng:** gomhangpro team

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
- Cần một ứng dụng di động nội bộ phân phối qua TestFlight cho nhân viên sử dụng.
- Yêu cầu ứng dụng có đầy đủ tất cả các tính năng y hệt như website hiện tại của công ty (`gomhangpro`).

## 2. GIẢI PHÁP ĐỀ XUẤT
- Xây dựng một **App Mobile đa nền tảng (React Native/Expo hoặc Flutter)**.
- Kết nối tới cùng backend/database mà website đang sử dụng để đồng bộ hoá 100% dữ liệu.
- Tái sử dụng (nếu đồng nhất stack như React) hoặc clone lại chính xác UI/UX và logic luồng nghiệp vụ của website.

## 3. ĐỐI TƯỢNG SỬ DỤNG
- **Primary:** Nhân viên nội bộ công ty.
- **Phân phối:** TestFlight (iOS nội bộ).

## 4. NGHIÊN CỨU THỊ TRƯỜNG & KHÁC BIỆT
*(Bỏ qua vì đây là app nghiệp vụ nội bộ clone từ website có sẵn)*

## 5. TÍNH NĂNG

### 🚀 MVP (Bắt buộc có):
- [ ] Tính năng đăng nhập/xác thực tài khoản nhân viên.
- [ ] Render chính xác các màn hình có trên website (Dashboard, Quản lý đơn hàng, Thống kê, v.v. - tuỳ thuộc vào chức năng web).
- [ ] Gọi API đồng bộ với backend website.
- [ ] Cấu hình Build cho TestFlight (Certificates, Provisioning Profiles, etc.).

### 🎁 Phase 2 (Làm sau):
- [ ] Push Notifications (Thông báo đẩy) nội bộ.
- [ ] Hỗ trợ dùng Offline một số tính năng (nếu cần).

## 6. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp:** Khá / Phức tạp (phụ thuộc vào số lượng màn hình và độ phức tạp logic của website hiện tại).
- **Rủi ro:**
  - Logic cũ phía website có thể cần chắt lọc hoặc viết lại API nếu phía web đang render luôn HTML gộp data (SSR/Monolith không có sẵn REST API).
  - Quản lý Apple Developer Account để push TestFlight.

## 7. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên thiết kế chi tiết (Tech stack cụ thể, Cấu trúc thư mục, API kết nối).
