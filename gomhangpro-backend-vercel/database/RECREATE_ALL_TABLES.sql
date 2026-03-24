-- Script SQL để XÓA TẤT CẢ BẢNG và TẠO LẠI TỪ ĐẦU
-- ⚠️ CẢNH BÁO: Script này sẽ XÓA TẤT CẢ DỮ LIỆU!
-- Chạy script này trong Supabase SQL Editor

-- ========================================
-- BƯỚC 1: XÓA TẤT CẢ BẢNG (theo thứ tự dependencies)
-- ========================================
-- Xóa triggers trước
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_shifts_updated_at ON shifts;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_counters_updated_at ON counters;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Xóa function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Xóa các bảng theo thứ tự (từ bảng phụ thuộc trước)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS counters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- BƯỚC 2: TẠO LẠI TẤT CẢ BẢNG
-- ========================================

-- Bảng Users (Nhân viên, Quản lý, Admin)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'manager', 'admin')),
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Bảng Refresh Tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo index cho refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Bảng Counters (Quầy)
CREATE TABLE counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Bảng Customers (Khách hàng)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo index cho customers
CREATE INDEX idx_customers_phone ON customers(phone);

-- Bảng Shifts (Ca làm việc)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counter_id UUID NOT NULL REFERENCES counters(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  tien_giao_ca NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tong_tien_hang_da_tra NUMERIC(15, 2) DEFAULT 0,
  quy_con_lai NUMERIC(15, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo index cho shifts
CREATE INDEX idx_shifts_staff_id ON shifts(staff_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_status ON shifts(status);

-- Bảng Orders (Đơn hàng)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  counter_id UUID NOT NULL REFERENCES counters(id) ON DELETE RESTRICT,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Các loại tiền
  tien_hang NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tien_cong_gom NUMERIC(15, 2) NOT NULL DEFAULT 0,
  phi_dong_hang NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tien_hoa_hong NUMERIC(15, 2) DEFAULT 0,
  tong_tien_hoa_don NUMERIC(15, 2) NOT NULL,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tạo index cho orders
CREATE INDEX idx_orders_shift_id ON orders(shift_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_staff_id ON orders(staff_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ========================================
-- BƯỚC 3: TẠO TRIGGER ĐỂ TỰ ĐỘNG CẬP NHẬT updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counters_updated_at BEFORE UPDATE ON counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- BƯỚC 4: TẮT ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- ========================================
-- BƯỚC 5: TẠO ADMIN USER
-- ========================================
INSERT INTO users (
  email,
  password_hash,
  name,
  phone,
  role,
  is_active
) VALUES (
  'nguyennhuquan9889@gmail.com',
  '$2b$10$TAvVJcEH9YzBn7phrbiC3OF5GXkdDcIXplnJHOvP871gw0CMEDb9m',
  'Administrator',
  NULL,
  'admin',
  true
)
RETURNING id, email, name, role, is_active;

-- ========================================
-- BƯỚC 6: KIỂM TRA LẠI
-- ========================================
-- Kiểm tra các bảng đã được tạo
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Kiểm tra admin đã được tạo
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM users
WHERE email = 'nguyennhuquan9889@gmail.com';

-- Kiểm tra RLS đã tắt
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'counters', 'customers', 'shifts', 'orders', 'refresh_tokens')
ORDER BY tablename;

-- Kiểm tra độ dài email
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'email';

-- ✅ HOÀN THÀNH!
-- Bạn có thể đăng nhập với:
-- Email: nguyennhuquan9889@gmail.com
-- Password: 123123A@

