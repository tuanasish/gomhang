const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.replace(/[\r\n]/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/[\r\n]/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const shiftId = 'bdd4abee-a468-40f5-8a9e-779c625e1b89';
  console.log(`Deleting mock shift: ${shiftId}`);

  // Delete from shift money additions first to avoid foreign key constraints (if any)
  await supabase
    .from('shift_money_additions')
    .delete()
    .eq('shift_id', shiftId);

  // Xoá ca test
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId);

  if (error) {
    console.error('Lỗi khi xoá ca do ràng buộc dữ liệu hoặc lỗi kết nối:', error);
    process.exit(1);
  }

  console.log('THÀNH CÔNG! Đã dọn dẹp sạch sẽ ca test khỏi hệ thống.');
}

main();
