import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env từ root của backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client với service role key để bypass RLS (Row Level Security)
// Chỉ dùng trong backend, KHÔNG expose ra frontend
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null as any;

// Helper để kiểm tra kết nối
export async function testSupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('⚠️  Supabase credentials not found');
      return false;
    }

    // Kiểm tra xem có phải publishable key không
    if (supabaseServiceKey.startsWith('sb_publishable_')) {
      console.error('❌ Lỗi: SUPABASE_SERVICE_ROLE_KEY đang là publishable key!');
      console.error('💡 Cần dùng Service Role Key (bắt đầu bằng eyJ...)');
      console.error('   Lấy từ: Supabase Dashboard → Settings → API → service_role key');
      return false;
    }

    if (!supabase) {
      console.error('❌ Supabase client is null');
      return false;
    }

    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error: any) {
    console.error('Supabase connection failed:', error.message || error);
    return false;
  }
}