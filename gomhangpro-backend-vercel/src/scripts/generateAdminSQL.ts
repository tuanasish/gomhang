import { hashPassword } from '../utils/bcrypt.utils';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateAdminSQL() {
  const email = 'nguyennhuquan9889@gmail.com';
  const password = '123123A@';
  const name = 'Administrator';
  
  console.log('🔐 Đang tạo password hash...');
  console.log(`   Password: ${password}\n`);
  
  // Generate hash
  const passwordHash = await hashPassword(password);
  
  // Create SQL script
  const sqlScript = `-- Script SQL để tạo admin trực tiếp trong Supabase
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
  '${email}',
  '${passwordHash}',
  '${name}',
  '${email}',
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
WHERE email = '${email}';

-- ✅ Sau khi chạy SQL này, bạn có thể đăng nhập với:
-- Email: ${email}
-- Password: ${password}
`;

  // Save to file
  const filePath = join(process.cwd(), 'database', 'create_admin_ready.sql');
  writeFileSync(filePath, sqlScript, 'utf-8');
  
  console.log('✅ Đã tạo file SQL sẵn sàng!');
  console.log(`\n📁 File: ${filePath}`);
  console.log('\n📋 Bước tiếp theo:');
  console.log('   1. Mở file: backend/database/create_admin_ready.sql');
  console.log('   2. Copy toàn bộ nội dung');
  console.log('   3. Paste vào Supabase SQL Editor và Run');
  console.log('\n🔑 Thông tin đăng nhập:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  
  // Also print to console for easy copy
  console.log('\n' + '='.repeat(60));
  console.log('SQL SCRIPT (Copy phần dưới đây):');
  console.log('='.repeat(60));
  console.log(sqlScript);
}

generateAdminSQL().catch(console.error);
