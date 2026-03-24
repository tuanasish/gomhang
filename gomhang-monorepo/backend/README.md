# Gom Hàng Pro - Backend API

Backend API cho hệ thống quản lý gom hàng Ninh Hiệp.

## Công nghệ sử dụng

- **Node.js** với **Express.js**
- **TypeScript**
- **CORS** để xử lý cross-origin requests

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cấu hình các biến môi trường trong file `.env`

## Chạy ứng dụng

### Development mode (với hot reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## Cấu trúc thư mục

```
backend/
├── src/
│   ├── server.ts          # Entry point của server
│   ├── routes/            # API routes (sẽ được thêm)
│   ├── controllers/       # Controllers (sẽ được thêm)
│   ├── models/            # Database models (sẽ được thêm)
│   ├── middleware/        # Custom middleware (sẽ được thêm)
│   └── utils/             # Utility functions (sẽ được thêm)
├── dist/                  # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Health Check
- `GET /api/health` - Kiểm tra trạng thái server

## Lưu ý

- Port mặc định: **5000**
- API sẽ được mở rộng với các endpoints cho:
  - Authentication (Đăng nhập, Đăng xuất)
  - Orders (Quản lý đơn hàng)
  - Users (Quản lý người dùng)
  - Reports (Báo cáo)

