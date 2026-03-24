import dotenv from 'dotenv';

dotenv.config();

/**
 * Script để test đăng nhập
 * Usage: tsx src/scripts/testLogin.ts <email> <password>
 */
async function testLogin() {
  const email = process.argv[2] || 'nguyennhuquan9889@gmail.com';
  const password = process.argv[3] || '123123A@';
  const apiUrl = process.env.API_URL || 'http://localhost:5000';

  console.log('🧪 Testing login...');
  console.log(`   Email: ${email}`);
  console.log(`   API URL: ${apiUrl}/api/auth/login\n`);

  try {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json() as any;

    if (response.ok && data.success) {
      console.log('✅ Đăng nhập thành công!\n');
      console.log('📋 User Info:');
      console.log(`   ID: ${data.data.user.id}`);
      console.log(`   Name: ${data.data.user.name}`);
      console.log(`   Email: ${data.data.user.email}`);
      console.log(`   Role: ${data.data.user.role}`);
      console.log(`\n🔑 Tokens:`);
      console.log(`   Access Token: ${data.data.accessToken.substring(0, 50)}...`);
      console.log(`   Refresh Token: ${data.data.refreshToken.substring(0, 50)}...`);
      console.log(`\n🎉 Hoàn tất! Bạn có thể đăng nhập qua frontend hoặc API.`);
    } else {
      console.error('❌ Đăng nhập thất bại!');
      console.error(`   Error: ${data.error || 'Unknown error'}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Lỗi khi test đăng nhập:', error.message);
    console.error('\n💡 Đảm bảo backend server đang chạy:');
    console.error('   cd backend && npm run dev');
    process.exit(1);
  }
}

testLogin();
