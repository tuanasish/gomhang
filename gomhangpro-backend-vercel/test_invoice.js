import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing saving to customer_daily_fees');

    // Using a valid UUID from the logs
    const customerId = 'b52cd773-1e09-4130-be81-2deb84293c30';
    const date = '2026-03-08';

    // Upsert payload exact match to backend controller
    const updatePayload = {
        customer_id: customerId,
        date: date,
        is_invoiced: true,
        phi_dong_gui: 0
    };

    console.log('Upsert payload:', updatePayload);

    // Upsert
    const { data: upsertData, error: upsertError } = await supabase
        .from('customer_daily_fees')
        .upsert(
            updatePayload,
            { onConflict: 'customer_id,date' }
        )
        .select()
        .single();

    console.log('Upsert Error:', upsertError);
    if (upsertData) console.log('Upsert Data:', upsertData);

}

test();
