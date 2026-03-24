# 📊 BÁO CÁO DỰ ÁN: GomHangPro

**Ngày review:** 03/03/2026

---

## 🎯 App này làm gì?

GomHangPro là **hệ thống quản lý đơn hàng gom hàng** dành cho khu vực Ninh Hiệp. Gồm 3 phần:

| Phần | Mô tả |
|------|-------|
| **Backend API** | Express + TypeScript + Supabase |
| **Frontend Web** | Website quản lý (thư mục `/frontend`) |
| **Mobile App** | React Native/Expo cho nhân viên & quản lý |

---

## 📁 Cấu trúc chính

```
gomhangpro-new/
├── backend/              ← API server (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/  ← 6 controllers (auth, orders, shifts, staff, customers, counters)
│   │   ├── routes/       ← 6 route files
│   │   ├── middleware/   ← Auth middleware (JWT)
│   │   └── server.ts     ← Entry point
│   └── database/         ← SQL scripts
│
├── frontend/             ← Website (chưa review chi tiết)
│
└── gomhangpro-app/       ← Mobile App (React Native/Expo)
    └── src/
        ├── api/          ← 8 files (axiosClient, auth, orders, shifts, staff, customers, counters)
        ├── screens/      ← 19 màn hình
        │   ├── manager/  ← 8 screens (Dashboard, Orders, Shifts, Staff, Customers, Counters, Settings, CustomerDetail)
        │   ├── worker/   ← 6 screens (Home, CreateOrder, OrderDetail, StartShift, EndShift, History)
        │   └── common/   ← 3 screens (Order, Profile, Shift)
        ├── navigation/   ← 6 navigators
        ├── utils/        ← 3 files (errorHelper, helpers, storage)
        ├── context/      ← AuthContext
        ├── components/   ← Common UI components
        └── theme/        ← Design tokens
```

---

## 🛠️ Công nghệ sử dụng

### Mobile App
| Thành phần | Công nghệ | Version |
|------------|-----------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo | ~54.0.33 |
| Navigation | React Navigation (Stack + Bottom Tabs) | 7.x |
| HTTP Client | Axios | 1.13.6 |
| PDF Export | expo-print + expo-sharing | 15.x / 14.x |
| Auth Storage | expo-secure-store | 55.0.8 |
| File System | expo-file-system (legacy) | built-in |

### Backend
| Thành phần | Công nghệ | Version |
|------------|-----------|---------|
| Runtime | Node.js + TypeScript | TS 5.8 |
| Framework | Express | 4.18 |
| Database | Supabase | 2.86 |
| Auth | JWT + bcrypt | 9.0 / 6.0 |
| Deploy | Vercel | configured |

---

## 📊 Code Stats

| Metric | App | Backend |
|--------|-----|---------|
| Tổng screens/controllers | **19** | **6** |
| API files/routes | **8** | **6** |
| File lớn nhất | AdminShiftsScreen (44KB) | shifts.controller (35KB) |
| Total code size | ~250KB | ~96KB |

---

## 📍 Đang làm dở gì?

**Vừa hoàn thành (03/03/2026):**
- ✅ Fix PDF export (web + mobile)
- ✅ Centralized error handling (8 screens)
- ✅ Fix tab bar labels bị khuất trên iPhone
- ✅ Fix footer PDF text mờ

**Pending:**
- 🔲 Build APK Android thử nghiệm
- 🔲 Build IPA iOS cho TestFlight
- 🔲 Test toàn bộ flow trên Android thực tế

---

## ✅ Điểm tốt

1. **Phân quyền rõ ràng** — Worker và Manager có navigator riêng, screens riêng
2. **Centralized error handling** — `errorHelper.js` xử lý lỗi tập trung, thông báo tiếng Việt
3. **API layer tách biệt** — Mỗi module có file API riêng, dùng chung `axiosClient`
4. **Platform-aware** — PDF export tự động chọn approach theo platform (web/mobile)
5. **Theme system** — Design tokens tập trung trong `theme.js`
6. **Backend TypeScript** — Type-safe, dễ maintain
7. **Supabase** — Database managed, không cần quản lý server DB
8. **Brain system** — `.brain/` lưu context project cho AI sessions

---

## ⚠️ Cần cải thiện

| # | Vấn đề | Ưu tiên | Gợi ý |
|---|--------|---------|-------|
| 1 | **File quá lớn** — `AdminShiftsScreen` 44KB, `CreateOrderScreen` 28KB, `OrderDetailScreen` 26KB | 🔴 Cao | Tách thành component con, dùng custom hooks |
| 2 | **SafeAreaView deprecated** — Warning hiện liên tục | 🟡 TB | Đổi sang `react-native-safe-area-context` |
| 3 | **Package version mismatch** — `datetimepicker` 8.6 vs expected 8.4, `secure-store` 55.0 vs ~15.0 | 🟡 TB | Chạy `npx expo install --fix` |
| 4 | **Không có unit tests** — Chưa có test nào cho app | 🟡 TB | Thêm Jest + React Testing Library |
| 5 | **Inline styles trong screens** — StyleSheet nằm cuối file thay vì tách riêng | 🟢 Thấp | Tách styles ra file riêng |
| 6 | **Hardcoded strings** — Nhiều text tiếng Việt hardcode | 🟢 Thấp | Tạo file i18n nếu cần đa ngôn ngữ |
| 7 | **Test files trong backend root** — `test_approve.cjs`, `test_login.cjs` | 🟢 Thấp | Move vào folder `tests/` |

---

## 🔧 Gợi ý cải thiện theo thứ tự

### 1. Tách file lớn (ưu tiên cao nhất)
```
AdminShiftsScreen.js (44KB, ~1035 dòng)
→ Tách: ShiftList, ShiftForm, ShiftDetail, MoneyModal
→ Custom hooks: useShifts, useShiftForm

CreateOrderScreen.js (28KB, ~735 dòng)
→ Tách: OrderForm, CustomerSearch, PriceSummary
→ Custom hooks: useOrderForm, useCustomerSearch
```

### 2. Fix warnings
```bash
npx expo install --fix   # Fix package versions
# Đổi SafeAreaView → SafeAreaView from react-native-safe-area-context
```

### 3. Thêm testing (khi ổn định)
```bash
npm install --save-dev jest @testing-library/react-native
# Viết test cho: Login flow, Order creation, Error handling
```

---

## 🚀 Cách chạy

```bash
# Backend
cd backend
npm install
npm run dev         # → http://localhost:5000

# Mobile App
cd gomhangpro-app
npm install
npx expo start -c   # Scan QR trên điện thoại

# Web
# Mở http://localhost:8081 sau khi expo start
```

**Lưu ý quan trọng:**
- Mobile cần file `.env` với `EXPO_PUBLIC_API_URL=http://<LAN_IP>:5000/api`
- Backend cần file `.env` với Supabase credentials + JWT secret

---

## 📝 Files quan trọng cần biết

| File | Chức năng |
|------|-----------|
| `src/context/AuthContext.js` | Quản lý đăng nhập/đăng xuất, token |
| `src/api/axiosClient.js` | Cấu hình API URL theo platform |
| `src/utils/errorHelper.js` | Xử lý lỗi tập trung, thông báo TV |
| `src/navigation/ManagerNavigator.js` | Tab bar cho quản lý |
| `src/navigation/WorkerNavigator.js` | Tab bar cho nhân viên |
| `src/screens/worker/OrderDetailScreen.js` | Chi tiết đơn + xuất PDF |
| `.brain/brain.json` | Kiến thức project cho AI |
| `.brain/session.json` | Trạng thái session hiện tại |
