const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.replace(/[\r\n]/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/[\r\n]/g, '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching shifts:', error);
    process.exit(1);
  }

  if (!shifts || shifts.length === 0) {
    console.log('Không tìm thấy ca nào đang active!');
    process.exit(0);
  }

  let shiftToUpdate;
  // ưu tiên lấy ca trong ngày hôm nay 
  // do server Supabase đang chạy giờ UTC, có thể lấy theo create_at
  shiftToUpdate = shifts[0];
  
  console.log(`Found active shift: ${shiftToUpdate.id} with date: ${shiftToUpdate.date}`);

  // Tính lùi 1 ngày
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yesterdayStr = `${yyyy}-${mm}-${dd}`;

  const { error: updateError } = await supabase
    .from('shifts')
    .update({ date: yesterdayStr, start_time: d.toISOString() })
    .eq('id', shiftToUpdate.id);

  if (updateError) {
    console.error('Error updating shift:', updateError);
    process.exit(1);
  }

  console.log(`THÀNH CÔNG! Đã ném ca ${shiftToUpdate.id} lùi về ngày: ${yesterdayStr}`);
  console.log(`Tiền giao ca hiện tại là: ${shiftToUpdate.tien_giao_ca}`);
}

main();
