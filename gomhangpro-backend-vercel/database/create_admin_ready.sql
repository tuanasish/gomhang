-- Script SQL để tạo admin trực tiếp trong Supabase
-- Copy toàn bộ script này và chạy trong Supabase SQL Editor

-- Tạo admin user
INSERT INTO public.users (
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
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  is_active = true,
  updated_at = NOW()
RETURNING id, email, name, role, is_active;

-- Kiểm tra admin đã được tạo
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM public.users
WHERE email = 'nguyennhuquan9889@gmail.com';

-- ✅ Sau khi chạy SQL này, bạn có thể đăng nhập với:
-- Email: nguyennhuquan9889@gmail.com
-- Password: 123123A@
