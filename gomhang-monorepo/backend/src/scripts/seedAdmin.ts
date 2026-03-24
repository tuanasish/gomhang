import dotenv from 'dotenv';
import { hashPassword } from '../utils/bcrypt.utils';
import { supabase } from '../config/supabase';

dotenv.config();

/**
 * Script để tạo tài khoản admin đầu tiên
 * Usage: tsx src/scripts/seedAdmin.ts
 */
async function seedAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Administrator';

  console.log('🌱 Bắt đầu tạo tài khoản admin...');

  // Check Supabase connection
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Lỗi: SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình trong .env');
    console.log('💡 Vui lòng tạo file .env và thêm:');
    console.log('   SUPABASE_URL=https://your-project.supabase.co');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', adminUsername)
      .single();

    if (existingAdmin && !checkError) {
      console.log(`⚠️  Tài khoản admin "${adminUsername}" đã tồn tại!`);
      console.log('💡 Nếu muốn đổi mật khẩu, vui lòng xóa user cũ và chạy lại script này.');
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Đang hash mật khẩu...');
    const passwordHash = await hashPassword(adminPassword);

    // Create admin user
    console.log('👤 Đang tạo tài khoản admin...');
    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert({
        username: adminUsername,
        password_hash: passwordHash,
        name: adminName,
        role: 'admin',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Lỗi khi tạo admin:', error);
      
      // Check if it's a table doesn't exist error
      if (error.message?.includes('relation') || error.code === '42P01') {
        console.error('\n💡 Có vẻ như các bảng chưa được tạo trong database!');
        console.log('📝 Vui lòng chạy schema SQL trong Supabase Dashboard:');
        console.log('   1. Vào SQL Editor trong Supabase');
        console.log('   2. Copy nội dung từ: backend/database/schema_supabase.sql');
        console.log('   3. Paste và Run');
      }
      
      process.exit(1);
    }

    console.log('\n✅ Tạo tài khoản admin thành công!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: admin`);
    console.log('\n⚠️  LƯU Ý: Hãy đổi mật khẩu sau lần đăng nhập đầu tiên!');
    console.log('\n🧪 Test đăng nhập:');
    console.log(`   POST http://localhost:5000/api/auth/login`);
    console.log(`   Body: { "username": "${adminUsername}", "password": "${adminPassword}" }`);

  } catch (error) {
    console.error('❌ Lỗi không mong đợi:', error);
    process.exit(1);
  }
}

seedAdmin().catch(console.error);

